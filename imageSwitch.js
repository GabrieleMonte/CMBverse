// Neutrino effective values array (rounded to 2 decimal places)
const N_eff_array = [0.1, 0.17, 0.24, 0.31, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72, 0.79, 0.86, 0.92, 0.99, 1.06, 1.13, 1.2, 1.27, 1.34, 1.41, 1.47, 1.54, 1.61, 1.68, 1.75, 1.82, 1.89, 1.96, 2.02, 2.09, 2.16, 2.23, 2.3, 2.37, 2.44, 2.51, 2.57, 2.64, 2.71, 2.78, 2.85, 2.92, 2.99, 3.05, 3.12, 3.19, 3.26, 3.33, 3.4, 3.47, 3.53, 3.6, 3.67, 3.74, 3.81, 3.88, 3.95, 4.01, 4.08, 4.15, 4.22, 4.29, 4.36, 4.43, 4.5, 4.56, 4.63, 4.7, 4.77, 4.84, 4.91, 4.98, 5.04, 5.11, 5.18, 5.25, 5.32, 5.39, 5.46, 5.52, 5.59, 5.66, 5.73, 5.8, 5.87, 5.94, 6.0, 6.07, 6.14, 6.21, 6.28, 6.35, 6.42, 6.49, 6.55, 6.62, 6.69, 6.76, 6.83, 6.9];
const ns_array = [0.8,  0.84, 0.87, 0.91, 0.94, 0.98, 1.01, 1.05, 1.09, 1.12, 1.16, 1.19, 1.23, 1.26, 1.3, 1.33, 1.37, 1.4, 1.44, 1.47, 1.51, 1.54, 1.58, 1.61, 1.65, 1.68, 1.72, 1.75, 1.79, 1.82, 1.86]
const ln1010As_array = [1.95, 2.11, 2.27, 2.44, 2.6, 2.77, 2.93, 3.1, 3.26, 3.43, 3.59, 3.76, 3.92, 4.08, 4.25, 4.41, 4.57, 4.73, 4.89, 5.05, 5.21, 5.37, 5.53, 5.69, 5.85, 6.01, 6.17, 6.33, 6.49, 6.65, 6.81, 6.97, 7.13, 7.29, 7.45, 7.61, 7.77, 7.93]
const m_nus_array = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]
// Function to update DL value
function updateValuemncdm(val) {
    const m_nus_value = m_nus_array[val - 1];
    document.getElementById('sliderValuemncdm').innerText = m_nus_value.toFixed(2);
    callMyScriptmncdm(val);
}

// Function to change DL image
function callMyScriptmncdm(value) {
    console.log("mncdm dampening slider value is: " + value);
    var img = document.getElementById("mncdmImage");
    img.src = 'class_figures/Neutrino_m_ncdm_images/Dl_ns_v' + value + '.png';
}

// Function to update Cosmo value
function updateValueCosmo(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueCosmo').innerText = N_eff_value.toFixed(2);
    callMyScriptCosmo(val);
}

// Function to change Cosmo image
function callMyScriptCosmo(value) {
    console.log("dl dampening slider value is: " + value);
    var img = document.getElementById("Cosmoimage");
    img.src = 'class_figures/Dl_cosmo_pars_images/Dl_Neff_v' + value + '.png';
}

// Function to update kTT value
function updateValueNnu1(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueNnu1').innerText = N_eff_value.toFixed(2);
    callMyScriptNnu1(val);
}

// Function to change kTT image
function callMyScriptNnu1(value) {
    console.log("Nnu1 slider value is: " + value);
    var img = document.getElementById("Nnu1Image");
    img.src = 'class_figures/Neutrino_Nnu1_images/Dl_damping_Neff_v' + value + '_lens.png';
}

// Function to update kEE value
function updateValueNnu2(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueNnu2').innerText = N_eff_value.toFixed(2);
    callMyScriptNnu2(val);
}

// Function to change kEE image
function callMyScriptNnu2(value) {
    console.log("Nnu2 dampening slider value is: " + value);
    var img = document.getElementById("Nnu2image");
    img.src = 'class_figures/Neutrino_Nnu2_images/kTT_phase_shift_Neff_v' + value + '_lens.png';
}

// Function to update A_S value
function updateValuea_s(val) {
    const ln1010As_value = ln1010As_array[val-1];
   document.getElementById('sliderValuea_s').innerText = ln1010As_value.toFixed(2);
   callMyScripta_s(val)

}

// function to change a_s image
function callMyScripta_s(value) {
    console.log('a_s slider value is' + value);
    var img = document.getElementById('imageAS');
    img.src = 'class_figures/a_s_figures/Dl_a_s_' + value + '.png';
}

//function to update n_s value
function updateValuen_s(val){
    const ns_value = ns_array[val-1];
    document.getElementById('sliderValuen_s').innerText = ns_value.toFixed(2);
    callMyScriptn_s(val)
}

// function to update n_s image
function callMyScriptn_s(value){
    console.log('n_s slider value is: ' + value);
    var img = document.getElementById('imageNS');
    img.src = 'class_figures/n_s_figures/Dl_s_n' + value + '.png';
}



// Function to update As and ns values and change image
function updateCombinedValue() {
    const As_index = document.getElementById('mySliderAs').value - 1;
    const ns_index = document.getElementById('mySliderNs').value - 1;

    const As_value = ln1010As_array[As_index];
    const ns_value = ns_array[ns_index];

    document.getElementById('sliderValueAs').innerText = As_value.toFixed(2);
    document.getElementById('sliderValueNs').innerText = ns_value.toFixed(2);

    updateSliderBackground(As_index + 1, 'mySliderAs');
    updateSliderBackground(ns_index + 1, 'mySliderNs');

    updateImage(As_index + 1, ns_index + 1);
}

// Function to update image based on As and ns values
function updateImage(As_index, ns_index) {
    const img = document.getElementById("Dlimage");
    img.src = `class_figures/As_ns_figures/Dl_As_${As_index}_ns_${ns_index}.png`;
}

// Function to initialize the sliders and their backgrounds
function initialize_As_ns_Sliders() {
    const initialAsValue = 8;
    const initialNsValue = 6;

    document.getElementById('mySliderAs').value = initialAsValue;
    document.getElementById('mySliderNs').value = initialNsValue;

    document.getElementById('sliderValueAs').innerText = ln1010As_array[initialAsValue - 1].toFixed(2);
    document.getElementById('sliderValueNs').innerText = ns_array[initialNsValue - 1].toFixed(2);

    updateSliderBackground(initialAsValue, 'mySliderAs');
    updateSliderBackground(initialNsValue, 'mySliderNs');
}

// Call initializeSliders when the page loads
window.onload = initialize_As_ns_Sliders;

// Function to update slider background
function updateSliderBackground(value, sliderId) {
    const slider = document.getElementById(sliderId);
    const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #7B4397 0%, #7B4397 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}
