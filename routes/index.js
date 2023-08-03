var express = require('express');
var router = express.Router();

let fields = {
  operatorName: { label: 'Operator Name', extra: '', autocomplete:true },
  mySRSRegistrationNo: { label: 'MySRS Registration No.', extra: '16 digit', autocomplete:true },
  uASModel: { label: 'UAS Model', extra: '', autocomplete:true },
  remotePilotsNames: { label: 'Remote Pilot(s) Name(s)', extra: '', autocomplete:true },
  mobilePhoneNumbers: { label: 'Mobile Phone Numbers', extra: 'Primary & Alternate', autocomplete:true },
  controlledAirspaceLocation: { label: 'Controlled Airspace Location', extra: ''},
  latitudeLongitude: {
    label: 'Latitude & Longitude',
    extra: 'Degrees, Minutes & Seconds'
  },
  radiusofOperation: { label: 'Radius of Operation', extra: 'm', value:30 },
  descriptionofArea: { label: 'Description of Area', extra: 'townland, landmark, etc.' },
  maximumAltitude: { label: 'Maximum Altitude', extra: 'AMSL' },
  heightAboveGroundLevel: { label: 'Height Above Ground Level', extra: 'AGL' },
  specificAssuranceandIntegrityLevel: { label: 'Specific Assurance and Integrity Level', extra: 'SAIL' },
  vHFCapabilityReceiverOnly: { label: 'VHF Capability, Receiver Only', extra: 'Y/N' },
  eIdentification: { label: 'E-Identification', extra: 'Y/N' },
  proposedDatesTimes: { label: 'Proposed Date(s) & Time(s)', extra: 'Local' },
  duration: { label: 'Duration', extra: 'HH:MM' }

}




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {fields: fields });
});

router.get('/privacy', function(req, res, next){
  res.render('privacy')
})

module.exports = router;
