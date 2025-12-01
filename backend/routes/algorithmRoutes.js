const express = require('express');
const router = express.Router();
const aStar = require('../controllers/aStarController');
const bfs = require('../controllers/bfsController');
const dfs = require('../controllers/dfsController');
const dls = require('../controllers/dlsController');
const hill = require('../controllers/hillClimbingController');
const best = require('../controllers/bestFirstController');
const bb = require('../controllers/branchAndBoundController');
const beam = require('../controllers/beamSearchController');

router.post('/a-star', aStar.run);
router.post('/bfs', bfs.run);
router.post('/dfs', dfs.run);
router.post('/dls', dls.run);
router.post('/hill-climbing', hill.run);
router.post('/best-first', best.run);
router.post('/branch-and-bound', bb.run);
router.post('/beam', beam.run);

module.exports = router;
