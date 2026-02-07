const express = require("express");
const router = express.Router();
const {
  getHomepage,
  getcontentPage,
  getGalleryPage,
  getconstant,
  getCountries,
  getstates,
  getcities,
  submitForm,
  activateIndividualAccount
} = require("../controllers/publicController");
router.get("/home", getHomepage);
router.get("/pages/:slug", getcontentPage);
router.get("/gallery", getGalleryPage);
router.get("/constants/:slug", getconstant);
router.get("/location/countries", getCountries);
router.get("/location/states/:countryId", getstates);
router.get("/location/city/:stateId", getcities);
router.post("/submitform", submitForm);
router.post("/activate_account", activateIndividualAccount);

module.exports = router;
