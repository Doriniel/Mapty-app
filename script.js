'use strict';

class Workout {
  date = new Date();
  id = Date.now().toString().slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude, longtitude]
    this.distance = distance; // in km
    this.duration = duration; //in minutes
  }

  _setDescription() {
    // prettier-ignore
    const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  ];
    // Running on April 14
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // in steps/min
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // in min/ km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain; // in meters
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // in km/hour
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

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
  #mapZoomNumber = 13;
  #workouts = [];

  constructor() {
    // getting user geolocation:
    this._getPosition();

    // getting data from Local Storage if there is any:
    this._getLocalStorage();

    // adding event listeners:
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._moveMarkerOnCLicks.bind(this)
    );
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

    this.#map = L.map('map').setView(coords, this.#mapZoomNumber);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map:
    this.#map.on('click', this._showForm.bind(this));

    // loading pop-ups of stored workouts from local storage - after map is being downloaded:
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // emptiying iputs:
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
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
      // check for validity and positive:
      if (
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

      // check for validity and positive:
      if (
        !validityCheck(distance, duration, elevationGain) &&
        !positiveCheck(distance, duration)
      )
        return alert(
          'The data you have applied is not in correct form. Please try again.'
        );

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    // console.log(workout);

    // Render workout on a list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Store data in a local storage:
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          mainWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveMarkerOnCLicks(e) {
    // matching user interface elements (workoutElem) with data from an array of workouts (#workouts) - by unique id number;
    const workoutElem = e.target.closest('.workout');

    if (!workoutElem) return;

    const workout = this.#workouts.find(
      work => work.id === workoutElem.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomNumber, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // setting local storage using API:
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // getting data from the local storage to render it in UI:

  _getLocalStorage() {
    const storageData = JSON.parse(localStorage.getItem('workouts'));
    console.log(storageData);

    if (!storageData) return;
    this.#workouts = storageData;

    this.#workouts.forEach(work => this._renderWorkout(work));
  }
}

const app = new App();
