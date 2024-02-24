const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/property");
const Schemas = require("../../Schemas/property");
const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");

router.post("/duestatus", ctrl.updateDuesData);

router.use(authenticate);
router.get("/", ctrl.getAllProp);
router.get("/getby", ctrl.getReqPropBy);
router.post("/add", validateBody(Schemas.addSchema), ctrl.addProperty);
router.post("/updateDueArrears", ctrl.updateDueArrearsForAll);

module.exports = router;
