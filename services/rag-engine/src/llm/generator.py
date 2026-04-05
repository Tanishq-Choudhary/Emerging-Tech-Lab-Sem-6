import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def _build_prompt(question: str, context_chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(context_chunks, start=1):
        file_path = chunk.get("file_path", "unknown")
        start_line = chunk.get("start_line", "?")
        end_line = chunk.get("end_line", "?")
        text = chunk.get("chunk_text", "")
        context_parts.append(
            f"[Chunk {i}] File: {file_path} | Lines: {start_line}-{end_line}\n{text}"
        )

    context_str = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are an expert code assistant. A developer is asking a question about a legacy codebase.
Use ONLY the provided code context to answer. Be specific — mention exact file names and line numbers when relevant.
If the context does not contain enough information, make educated guess based on specifics available to you."

### Code Context:
{context_str}

### Question:
{question}

### Answer:"""

    return prompt


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    hf_token = os.getenv("HF_API_TOKEN", "")
    model = os.getenv("LLM_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")

    if not hf_token:
        print("[llm] Warning: HF_API_TOKEN not set. Returning fallback response.")
        return _fallback_answer(context_chunks)

    prompt = _build_prompt(question, context_chunks)

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": 512,
        "temperature": 0.2,
        "stop": ["### Question:", "### Context:"]
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://router.huggingface.co/featherless-ai/v1/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            # OpenAI-compatible response format
            answer = data["choices"][0]["text"].strip()
            if answer:
                return answer

            print(f"[llm] Unexpected response format: {data}")
            return _fallback_answer(context_chunks)

    except httpx.TimeoutException:
        print("[llm] HuggingFace API request timed out.")
        return _fallback_answer(context_chunks)

    except httpx.HTTPStatusError as e:
        print(f"[llm] HuggingFace API error {e.response.status_code}: {e.response.text}")
        return _fallback_answer(context_chunks)

    except Exception as e:
        print(f"[llm] Unexpected error during generation: {e}")
        return _fallback_answer(context_chunks)


def _fallback_answer(context_chunks: list[dict]) -> str:
    if not context_chunks:
        return "No relevant code found in the codebase for your query."

    top = context_chunks[0]
    file_path = top.get("file_path", "unknown")
    start_line = top.get("start_line", "?")
    end_line = top.get("end_line", "?")

    return (
        f"Most relevant match found in `{file_path}` "
        f"(lines {start_line}–{end_line}):\n\n"
        f"{top.get('chunk_text', '')}"
    )