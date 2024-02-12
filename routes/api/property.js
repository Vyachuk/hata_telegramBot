const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/property");

router.get("/", ctrl.getAllProp);
router.post("/updateDueArrears", ctrl.updateDueArrearsForAll);
router.post("/electricstatus", ctrl.updateElectricData);
router.post("/duestatus", ctrl.updateDuesData);

module.exports = router;
