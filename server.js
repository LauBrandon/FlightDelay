var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql2');
var moment = require('moment');


var connection = mysql.createConnection({
  host: '34.30.205.92',
  user: 'root',
  password: 'myinstance',
  database: 'airlineTravel'
})

connection.connect;

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

var query_table = `SELECT FlightSchedule.flightNumber, FlightSchedule.tailNumber, FlightSchedule.airlineCode ,airportOriginCode, airportDestinationCode, FlightSchedule.date , scheduledDeparture , FlightSchedule.scheduledArrival, arrivalDelayTime
             FROM FlightSchedule 
             JOIN DelayedFlights 
             ON (FlightSchedule.flightNumber = DelayedFlights.flightNumber AND
               FlightSchedule.airlineCode = DelayedFlights.airlineCode AND
                FlightSchedule.date = DelayedFlights.date AND
                FlightSchedule.scheduledArrival = DelayedFlights.scheduledArrival AND
                FlightSchedule.tailNumber = DelayedFlights.tailNumber) LIMIT 500`;


app.get('/', function(req, res) {

  connection.query(query_table, function(err, rows, fields) {
    if (err) throw err;

    res.render('index', { data: rows });

  });

});



app.get('/stateAvgDelay', function(req, res) {
   var query = `CALL GetStateDelayTime()`;

    connection.query(query, function(err, rows, fields) {
      if (err) throw err;

      //console.log(rows[0]);
      res.render('stateAvgDelay', { data: rows[0] });

    });
});

app.get('/airlineMostDelay', function(req, res) {
    var query = `CALL GetMostFlightDelayByAirline()`;

    
    connection.query(query, function(err, rows, fields) {
      if (err) throw err;

      console.log(rows[0]);
      res.render('airlineMostDelay', { data: rows[0] });

    });
  });

      

app.post('/edit', function(req, res) {
  console.log(req.body);
  res.render('edit', { data: req.body });

});

app.post('/update', function(req, res) {

  const {flightNumber2 ,tailNumber2,airlineCode2, origin2, destination2,date2, departureTime2, arrivalTime2, delayedTime2, flightNumber, tailNumber,airlineCode, origin, destination,date, departureTime, arrivalTime, delayedTime } = req.body;

  const formattedDepartureTime = moment(departureTime, 'hh:mm').format('HHmm');
  const formattedArrivalTime = moment(arrivalTime, 'hh:mm A').format('HHmm');

  //console.log(flightNumber, tailNumber,airlineCode, origin, destination, date, formattedDepartureTime, formattedArrivalTime, delayedTime);

  var query1 = `UPDATE FlightSchedule SET flightNumber = ${flightNumber}, date = '${date}', tailNumber = '${tailNumber}', airlineCode = '${airlineCode}',
   airportOriginCode = '${origin}', airportDestinationCode = '${destination}', scheduledDeparture = '${formattedDepartureTime}',
    scheduledArrival = '${formattedArrivalTime}'
     WHERE flightNumber = ${flightNumber2} AND date = '${date2}' AND tailNumber = '${tailNumber2}' AND airlineCode = '${airlineCode2}' AND
      airportOriginCode = '${origin2}' AND airportDestinationCode = '${destination2}' AND scheduledDeparture = '${departureTime2}' AND
       scheduledArrival = '${arrivalTime2}' LIMIT 1`;
  connection.query(query1, function(err, rows, fields) {
    if (err) throw err;
  });

  var query2 = `UPDATE DelayedFlights SET flightNumber = ${flightNumber}, date = '${date}', tailNumber = '${tailNumber}', airlineCode = '${airlineCode}',
    scheduledArrival = '${formattedArrivalTime}', arrivalDelayTime = '${delayedTime}'
      WHERE flightNumber = ${flightNumber2} AND date = '${date2}' AND tailNumber = '${tailNumber2}' AND airlineCode = '${airlineCode2}' AND
        scheduledArrival = '${arrivalTime2}' LIMIT 1`;
  
  connection.query(query2, function(err, rows, fields) {
    if (err) throw err;
  });
  

  res.redirect('/');
});





app.post('/add', function(req, res) {
  const { flightNumber, tailNumber,airlineCode, origin, destination,date, departureTime, arrivalTime, delayedTime } = req.body;

  const formattedDepartureTime = moment(departureTime, 'hh:mm').format('HHmm');
  const formattedArrivalTime = moment(arrivalTime, 'hh:mm A').format('HHmm');

  //console.log(flightNumber, tailNumber,airlineCode, origin, destination, date, formattedDepartureTime, formattedArrivalTime, delayedTime);

  var query1 = `INSERT INTO FlightSchedule (flightNumber,date,tailNumber ,airlineCode, airportOriginCode, airportDestinationCode,scheduledDeparture, scheduledArrival) VALUES (${flightNumber},'${date}','${tailNumber}', '${airlineCode}', '${origin}', '${destination}' ,'${formattedDepartureTime}', '${formattedArrivalTime}')`;

  var query2 = `INSERT INTO DelayedFlights (flightNumber, airlineCode, date,tailNumber, scheduledArrival, arrivalDelayTime) VALUES (${flightNumber}, '${airlineCode}', '${date}', '${tailNumber}', '${formattedArrivalTime}', '${delayedTime}')`;

  connection.query(query1, function(err, rows, fields) {
    if (err) throw err;
  });

  connection.query(query2, function(err, rows, fields) {
    if (err) throw err;
  });
  
  res.redirect('/');
});

app.post('/delete', function(req, res) {

  const { flightNumber, tailNumber,airlineCode, origin, destination,date, departureTime, arrivalTime, delayedTime } = req.body;

  console.log(flightNumber, tailNumber,airlineCode, origin, destination, date, departureTime, arrivalTime, delayedTime);
  
  var query1 = `DELETE FROM FlightSchedule WHERE flightNumber = ${flightNumber} AND date = '${date}' AND tailNumber = '${tailNumber}' AND airlineCode = '${airlineCode}' AND airportOriginCode = '${origin}' AND airportDestinationCode = '${destination}' AND scheduledDeparture = '${departureTime}' AND scheduledArrival = '${arrivalTime}' LIMIT 1`;

  var query2 = `DELETE FROM DelayedFlights WHERE flightNumber = ${flightNumber} AND date = '${date}' AND tailNumber = '${tailNumber}' AND airlineCode = '${airlineCode}' AND scheduledArrival = '${arrivalTime}' AND arrivalDelayTime = '${delayedTime}' LIMIT 1`;

  connection.query(query1, function(err, rows, fields) {
    if (err) throw err;
  });

  connection.query(query2, function(err, rows, fields) {
    if (err) throw err;
  });
  res.redirect('/');

      
});


app.get('/search', function(req, res) {
  var search = req.query.search;
  //console.log(search);
  //console.log(typeof(search));
  var query = `SELECT FlightSchedule.flightNumber, FlightSchedule.tailNumber, FlightSchedule.airlineCode ,airportOriginCode, airportDestinationCode,FlightSchedule.date, scheduledDeparture , FlightSchedule.scheduledArrival, arrivalDelayTime
              FROM FlightSchedule
              JOIN DelayedFlights
              ON (FlightSchedule.flightNumber = DelayedFlights.flightNumber AND
                FlightSchedule.airlineCode = DelayedFlights.airlineCode AND
                  FlightSchedule.date = DelayedFlights.date AND
                  FlightSchedule.scheduledArrival = DelayedFlights.scheduledArrival AND
                  FlightSchedule.tailNumber = DelayedFlights.tailNumber)
              WHERE FlightSchedule.flightNumber = ${search}`;
  
      connection.query(query, function(err, rows, fields) {
        if (err) throw err;
    
        res.render('index', { data: rows });
        
      });

  });
              

app.listen(80, function () {
    console.log('Node app is running on port 80');
});
