// Neutrino effective values array
const N_eff_array = [0.1, 0.17, 0.24, 0.31, 0.38, 0.45, 0.52, 0.59, 0.66, 0.73, 0.8, 0.87, 0.94, 1.01, 1.08, 1.15, 1.22, 1.29, 1.36, 1.43, 1.5, 1.57, 1.64, 1.71, 1.78, 1.85, 1.92, 1.99, 2.06, 2.13, 2.2, 2.27, 2.34, 2.41, 2.48, 2.55, 2.62, 2.69, 2.76, 2.83, 2.9, 2.97, 3.04, 3.11, 3.18, 3.25, 3.32, 3.39, 3.46, 3.53, 3.6, 3.67, 3.74, 3.81, 3.88, 3.95, 4.02, 4.09, 4.16, 4.23, 4.3, 4.37, 4.44, 4.51, 4.58, 4.65, 4.72, 4.79, 4.86, 4.93, 5.0, 5.07, 5.14, 5.21, 5.28, 5.35, 5.42, 5.49, 5.56, 5.63, 5.7, 5.77, 5.84, 5.91, 5.98, 6.05, 6.12, 6.19, 6.26, 6.33, 6.4, 6.47, 6.54, 6.61, 6.68, 6.75, 6.82, 6.89, 6.96, 7.03];

// Function to update DL value
function updateValueDL(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueDL').innerText = N_eff_value.toFixed(2);
    callMyScriptDL(val);
}

// Function to change DL image
function callMyScriptDL(value) {
    console.log("dl dampening slider value is: " + value);
    var img = document.getElementById("Dlimage");
    img.src = 'class_figures/Dl_Neff_damping_images/Dl_damping_Neff_v' + value + '.png';
}

// Function to update kTT value
function updateValuekTT(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValuekTT').innerText = N_eff_value.toFixed(2);
    callMyScriptkTT(val);
}

// Function to change kTT image
function callMyScriptkTT(value) {
    console.log("kTT slider value is: " + value);
    var img = document.getElementById("KTTImage");
    img.src = 'class_figures/kTT_phase_shift_neff_lens_images/kTT_phase_shift_Neff_v' + value + '_lens.png';
}

// Function to update kEE value
function updateValuekEE(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValuekEE').innerText = N_eff_value.toFixed(2);
    callMyScriptkEE(val);
}

// Function to change kEE image
function callMyScriptkEE(value) {
    console.log("kEE dampening slider value is: " + value);
    var img = document.getElementById("kEEimage");
    img.src = 'class_figures/kEE_phase_shift_neff_lens_images/kEE_phase_shift_Neff_v' + value + '_lens.png';
}
