const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/electric");
// const Schemas = require("../../Schemas/property");
// const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");
const validateBody = require("../../middlewares/validateBody");
const Schemas = require("../../Schemas/electric");

// router.post("/duestatus", ctrl.updateDuesData);
// router.post("/electricstatus", ctrl.updateElectricData);
router.post("/electricstatus", ctrl.updateElectricIndicatorFromLiqpay);

router.use(authenticate);
router.get("/", ctrl.getElectric);
router.post("/update-relation", ctrl.updateElectricIdToAllProp);
router.post("/add", validateBody(Schemas.addSchema), ctrl.addElectric);

module.exports = router;
