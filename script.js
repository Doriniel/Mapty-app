'use strict';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

class Workout {
  date = new Date();
  id = Date.now().toString().split(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude, longtitude]
    this.distance = distance; // in km
    this.duration = duration; //in minutes
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // in steps/min
    this.calcPace();
  }

  calcPace() {
    // in min/ km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain; // in meters
    this.calcSpeed();
  }

  calcSpeed() {
    // in km/hour
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run = new Running([36, 18], 10, 30, 70);
// const cycle1 = new Cycling([36, 17], 20, 65, 120);

// console.log(run, cycle1);

//----//----//----//----//----//----//----//----//----//----//
// App Architecture //
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // using bind to bind object to a call-back function that doesn't have it's own this when called
        function () {
          alert('Could not get your geolocation!');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map:
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // Get data from form inputs
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const validityCheck = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const positiveCheck = (...inputs) => inputs.every(inp => inp > 0);

    // If workout is running - check validity and create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validityCheck(distance, duration, cadence) &&
        !positiveCheck(distance, duration, cadence)
      )
        return alert(
          'The data you have applied is not in correct form. Please try again.'
        );

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling - check validity and create cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;

      if (
        !validityCheck(distance, duration, elevationGain) &&
        !positiveCheck(distance, duration)

        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevationGain)
      )
        return alert(
          'The data you have applied is not in correct form. Please try again.'
        );

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    console.log(workout);

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          mainWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(`workout: ${type}.`)
      .openPopup();

    // Render workout on a list

    // Clearing inputs:
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
}

const app = new App();
