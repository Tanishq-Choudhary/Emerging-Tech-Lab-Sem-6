// Job management and status tracking routes
const { Router } = require('express');
const jobRepo = require('codeatlas-shared/../ingestion-service/src/repository/job.repo');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const stats = await jobRepo.getStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job.toJSON());
  } catch (err) {
    next(err);
  }
});

router.get('/document/:documentId', async (req, res, next) => {
  try {
    const jobs = await jobRepo.findByDocumentId(req.params.documentId);
    res.json({ jobs: jobs.map((j) => j.toJSON()) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const job = await jobRepo.cancel(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found or already terminal' });
    }
    res.json(job.toJSON());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
