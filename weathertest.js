fetch('https://api.openweathermap.org/data/2.5/weather?q=Nairobi,KE&appid=bd5e378503939ddaee76f12ad7a97608&units=metric')
  .then(response => response.json())
  .then(data => console.log(data));