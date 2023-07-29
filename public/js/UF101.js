  // the dom element for the latlng
  let $latLng;
  // the dom element for the controlled airspace location
  let $controlledAirspaceLocation;

  // the area of operations variables
  let radius = 30;
  let aoOCenter;
  let circleLayer;

  // the operator variables
  let operatorCenter;
  let operatorLayer;

  let map;
  let MAP_MODES = {
    OPERATION_ZONE:'operation zone',
    OPERATOR:'operator'
  };
  let mapMode = MAP_MODES.OPERATION_ZONE;

  // 53° 29' 40''
  let dmsPattern = /-?\d{1,3}° \d{1,2}' \d{1,2}''/;
  // 53.64463782485651
  let decPattern = /-?\d{1,3}\.?\d+/;


  // mode selection control definition
  let control = {
    onAdd:function(map)
    {
      let containerDiv = L.DomUtil.create('div');

      let operatingAreaContainer = L.DomUtil.create('div', 'controlContainer active', containerDiv);
      L.DomEvent.on(operatingAreaContainer, 'dblclick', function(evt){
        L.DomEvent.stopPropagation(evt);
      });
      L.DomEvent.on(operatingAreaContainer, 'click', function(evt){
        L.DomEvent.stopPropagation(evt);
        if(mapMode !== MAP_MODES.OPERATION_ZONE)
        {
          mapMode = MAP_MODES.OPERATION_ZONE;
          updateActive(this);
        }
      });
      operatingAreaContainer.style.height="27px";
      let operatingAreaDiv = L.DomUtil.create('div', 'control circle', operatingAreaContainer);
      operatingAreaDiv.title="Set mode to area of operation";

      let operatorContainer = L.DomUtil.create('div', 'controlContainer inactive', containerDiv);
      L.DomEvent.on(operatorContainer, 'click', function(evt){
        L.DomEvent.stopPropagation(evt);

        if(mapMode !== MAP_MODES.OPERATOR)
        {
          mapMode = MAP_MODES.OPERATOR;
          updateActive(this);
        }
      });
      let operatorMarker = L.DomUtil.create('img', 'controlImage', operatorContainer);
      operatorMarker.src='https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      operatorMarker.title="Set mode to operator";
      return containerDiv;
    }
  };
  L.Control.modeSelector = L.Control.extend(control);


  function updateActive(node)
  {
    let active = document.querySelector('.controlContainer.active');
    if(active) {
      active.classList.remove('active');
      active.classList.add('inactive');
    }
    if(node) {
      node.classList.remove('inactive');
      node.classList.add('active');
    }
  }

  function featureHandler(feature, layer)
  {
    L.DomEvent.on(layer, 'click', function(evt){
      $controlledAirspaceLocation.value = feature.properties.name;
    });
  }





  // page loader
  window.addEventListener('load', ()=>{
    $latLng = document.getElementById('latitudeLongitude');
    $radius = document.getElementById('radiusofOperation');
    $controlledAirspaceLocation = document.getElementById('controlledAirspaceLocation');

    $latLng.addEventListener('change', (evt)=>{
      let latLngVal = $latLng.value;
      let center;
      if(latLngVal.indexOf(',')>=0)
      {
        let [part1, part2] = latLngVal.split(',');
        let lat = part1.match(dmsPattern);
        let lng = part2.match(dmsPattern);
        if(lat && lng)
        {
          // have latlng in required format so need to covert it to decimal for the aoOCenter
          lat = lat[0].trim();
          lng = lng[0].trim();

          if(!aoOCenter)
          {
            center = {
              lat:convertFromDMS(lat),
              lng:convertFromDMS(lng)
            };
          }

        }
        else
        {
          // sample useful value
          // 53.64463782485651, -7.207031250000001
          lat = part1.match(decPattern);
          lng = part2.match(decPattern);
          if (lat && lng) {
            lat = parseFloat(lat[0].trim());
            lng = lng[0].trim();
            let rem = part2.replace(lng, '').trim();
            lng = parseFloat(lng);
            center = {lat:lat,lng:lng};
            $latLng.value = `${convertToDMS(lat)}, ${convertToDMS(lng)} ${rem}`;
          } else {
            console.log("Something went wrong");
            console.log(lat, lng);
          }
        }
      }

      if(center)
      {
        aoOCenter = center;
        updateAoOMarker();
      }
    });

    const form = document.forms.namedItem('uf101Form');
    form.addEventListener(
            'submit',
            (event)=>{
              const formData = new FormData(form);
              leafletImage(map, function(err, canvas) {
                renderPDF(formData, canvas).then((pdf)=>{
                  download(pdf, 'uf101.pdf', 'application/pdf');
                }).catch((err)=>{
                  console.log(err);
                });
              });

              event.preventDefault();
            }
    );

    // geolocation event handler
      let mapOptions = {
        center: [53.4495, -7.5030],
        zoom: 7
      }
      // Creating a map object
      map = new L.map('map', mapOptions);
      // Creating a Layer object
      let layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      // Adding layer to the map
      map.addLayer(layer);

      L.control.modeselector = function(opts){
        return new L.Control.modeSelector(opts);
      }

      L.control.modeselector({position:'topleft'}).addTo(map);

      map.on('click', function(evt){handleMouseClick(evt)});

    fetch(
      "/files/Irish UGZ.geo.json"
    ).then(async (response)=>{
      let json = await response.json();
      return Promise.resolve(json);
    }).then((json)=>{
      let featuresLayer = L.geoJSON(
        json,
        {
          style:function(feature){
            let style = {
              stroke:feature.properties.stroke,
              color:feature.properties.fill,
              opacity:feature.properties['fill-opacity']
            };
            return style;
          },
          onEachFeature:featureHandler
        }
      ).addTo(map);
      featuresLayer.addData(json);
    }).catch((error)=>{
      console.log(error);
    });



    // add the event handler for changing the radius
      $radius.addEventListener('change', function(){
        radius = parseInt($radius.value);
        if(aoOCenter)
        {
          updateAoOMarker();
        }
      });
  });

  function handleMouseClick(evt)
  {
    let center = evt.latlng;

    switch(mapMode)
    {
      case MAP_MODES.OPERATOR:
        operatorCenter = center;
        updateOperatorMarker();
        break;
      case MAP_MODES.OPERATION_ZONE:
        aoOCenter = center;
        updateAoOMarker();
        break;
    }
  }

  function updateOperatorMarker()
  {
    if(operatorLayer)
    {
      map.removeLayer(operatorLayer);
    }
    operatorLayer = L.marker(
            operatorCenter,
            {
              renderer:L.canvas()
            }
          ).addTo(map);
  }

  function updateAoOMarker()
  {
    if(circleLayer)
    {
      map.removeLayer(circleLayer);
    }

    circleLayer = L.circle(
            aoOCenter,
            {
              renderer:L.canvas(),
              radius: parseInt($radius.value)
            }
          ).addTo(map);
    $latLng.value=`${convertToDMS(aoOCenter.lat)}, ${convertToDMS(aoOCenter.lng)}`;
  }

  function convertToDMS(dec)
  {
    let deg = Math.trunc(dec);
    let rem = Math.abs(dec) - Math.abs(deg);
    let minsDec = 60 * rem;
    let mins = Math.floor(minsDec);
    let secsDec = minsDec - mins;
    let secs = Math.round(secsDec * 60);
    return `${deg}° ${mins}' ${secs}''`;
  }

  function convertFromDMS(dms)
  {
    //53° 29' 40''
    let [d, m, s] = dms.split(' ');
    let deg = parseInt(d.substring(0, d.length - 1));
    let min = parseInt(m.substring(0, m.length - 1));
    let sec = parseInt(s.substring(0, s.length - 2));

    let dec = deg + min / 60 + sec / 3600;
    return dec;
  }

  // pdf stuff
  async function renderPDF(formData, canvas) {
    const {PDFDocument, rgb, StandardFonts} = PDFLib;
    const url = '/files/UF101.pdf';
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const {height} = firstPage.getSize();
    let startingY = 212;
    let startingX = 275;
    let fontSize = 10;
    let defaultYOffset = 14;



    for(const [key, value] of formData)
    {
      firstPage.drawText(value, {x:startingX, y:height - startingY, size:fontSize,font:helveticaFont, color:rgb(0,0,0)});
      // field smoothing
      if(key === 'controlledAirspaceLocation' || key === 'latitudeLongitude')
      {
        startingY+= 21;
      }
      else if (key === 'descriptionofArea')
      {
        startingY += 15;
      }
      else if(key === 'vHFCapabilityReceiverOnly')
      {
        startingY += 16;
      }
      else if(key === 'eIdentification')
      {
        startingY += 16;
      }
      else
      {
        startingY += defaultYOffset;
      }
    }

    let pdfImg = await pdfDoc.embedPng(canvas.toDataURL());
    let scaleAmount = 1;
    let scale = pdfImg.scale(scaleAmount);
    let maxWidth = 535;
    let maxHeight = 210;
    while(scale.width > maxWidth || scale.height > maxHeight)
    {
      scaleAmount *= 0.99;
      scale = pdfImg.scale(scaleAmount);
    }

    firstPage.drawImage(pdfImg,
      {
        x:35, y:150, width:scale.width, height:scale.height
      }
    );

    return pdfDoc.save();

  }