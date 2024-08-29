// Neutrino effective values array (rounded to 2 decimal places)
const N_eff_array = [0.1, 0.17, 0.24, 0.31, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72, 0.79, 0.86, 0.92, 0.99, 1.06, 1.13, 1.2, 1.27, 1.34, 1.41, 1.47, 1.54, 1.61, 1.68, 1.75, 1.82, 1.89, 1.96, 2.02, 2.09, 2.16, 2.23, 2.3, 2.37, 2.44, 2.51, 2.57, 2.64, 2.71, 2.78, 2.85, 2.92, 2.99, 3.05, 3.12, 3.19, 3.26, 3.33, 3.4, 3.47, 3.53, 3.6, 3.67, 3.74, 3.81, 3.88, 3.95, 4.01, 4.08, 4.15, 4.22, 4.29, 4.36, 4.43, 4.5, 4.56, 4.63, 4.7, 4.77, 4.84, 4.91, 4.98, 5.04, 5.11, 5.18, 5.25, 5.32, 5.39, 5.46, 5.52, 5.59, 5.66, 5.73, 5.8, 5.87, 5.94, 6.0, 6.07, 6.14, 6.21, 6.28, 6.35, 6.42, 6.49, 6.55, 6.62, 6.69, 6.76, 6.83, 6.9];
const ns_array = [0.8,  0.84, 0.87, 0.91, 0.94, 0.98, 1.01, 1.05, 1.09, 1.12, 1.16, 1.19, 1.23, 1.26, 1.3, 1.33, 1.37, 1.4, 1.44, 1.47, 1.51, 1.54, 1.58, 1.61, 1.65, 1.68, 1.72, 1.75, 1.79, 1.82, 1.86]
const ln1010As_array = [1.95, 2.11, 2.27, 2.44, 2.6, 2.77, 2.93, 3.1, 3.26, 3.43, 3.59, 3.76, 3.92, 4.08, 4.25, 4.41, 4.57, 4.73, 4.89, 5.05, 5.21, 5.37, 5.53, 5.69, 5.85, 6.01, 6.17, 6.33, 6.49, 6.65, 6.81, 6.97, 7.13, 7.29, 7.45, 7.61, 7.77, 7.93]
const m_nus_array = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]
const Omega_L_pie_array = [0.409, 0.44 , 0.471, 0.502, 0.533, 0.564, 0.596, 0.627, 0.658, 0.689, 0.72 , 0.751, 0.782, 0.813, 0.844, 0.876, 0.907, 0.938, 0.969]
const omega_m_pie_array = [0.099, 0.104, 0.109, 0.113, 0.118, 0.123, 0.128, 0.133, 0.138, 0.142, 0.147, 0.152, 0.157, 0.162, 0.167, 0.171, 0.176, 0.181, 0.186]
const omega_b_pie_array = [0.0154, 0.0162, 0.017 , 0.0178, 0.0185, 0.0193, 0.0201, 0.0209, 0.0216, 0.0224, 0.0232, 0.024 , 0.0248, 0.0255, 0.0263, 0.0271, 0.0279, 0.0286, 0.0294]
const omega_cdm_arrary = [0.00, 0.00, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.02, 0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.10, 0.10, 0.10, 0.10, 0.11, 0.11, 0.11, 0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.13, 0.14, 0.14, 0.14]
const omega_b_arrary = [0.02, 0.02, 0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09, 0.10, 0.10, 0.10, 0.10, 0.11, 0.11, 0.11, 0.11, 0.12, 0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.13, 0.14, 0.14, 0.14, 0.14]


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

// Function to update Neutrino Nnu1 value
function updateValueNnu1(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueNnu1').innerText = N_eff_value.toFixed(2);
    callMyScriptNnu1(val);
}

// Function to change Neutrino Nnu1 image
function callMyScriptNnu1(value) {
    console.log("Nnu1 slider value is: " + value);
    var img = document.getElementById("Nnu1Image");
    img.src = 'class_figures/Neutrino_Nnu1_images/Dl_damping_Neff_v' + value + '.png';
}

// Function to update Neutrino Nnu2 value
function updateValueNnu2(val) {
    const N_eff_value = N_eff_array[val - 1];
    document.getElementById('sliderValueNnu2').innerText = N_eff_value.toFixed(2);
    callMyScriptNnu2(val);
}

// Function to change Neutrino Nnu2 image
function callMyScriptNnu2(value) {
    console.log("Nnu2 dampening slider value is: " + value);
    var img = document.getElementById("Nnu2image");
    img.src = 'class_figures/Neutrino_Nnu2_images/kTT_phase_shift_Neff_v' + value + '_lens.png';
}

// Function to update omega_cdm value
function updateValueomega_cdm(val) {
    const omega_cdm_value = omega_cdm_array[val - 1];
    document.getElementById('sliderValueomega_cdm').innerText = omega_cdm_value.toFixed(2);
    callMyScriptomega_cdm(val);
}

// Function to change omega_cdm image
function callMyScriptomega_cdm(value) {
    console.log("omega_cdm slider value is: " + value);
    var img = document.getElementById("omega_cdmImage");
    img.src = 'class_figures/omega_cdm_images/Dl_omega_cdm_v' + value + '.png';
}

// Function to update Neutrino Nnu2 value
function updateValueomega_cdm_aeq_fixed(val) {
    const omega_cdm_aeq_fixed_value = omega_cdm_aeq_fixed_array[val - 1];
    document.getElementById('sliderValueomega_cdm_aeq_fixed').innerText = omega_cdm_aeq_fixed_value.toFixed(2);
    callMyScriptomega_cdm_aeq_fixed(val);
}

// Function to change Neutrino Nnu2 image
function callMyScriptomega_cdm_aeq_fixed(value) {
    console.log("omega_cdm_aeq_fixed dampening slider value is: " + value);
    var img = document.getElementById("omega_cdm_aeq_fixedimage");
    img.src = 'class_figures/omega_cdm_aeq_fixed_images/Dl_omega_cdm_fixed_aeq_v' + value + '_new.png';
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
    const Omega_L_index = document.getElementById('mySliderOmegaL').value - 1;
    const omega_m_index = document.getElementById('mySlideromegam').value - 1;
    const omega_b_index = document.getElementById('mySlideromegab').value - 1;
    const Omega_L_value = Omega_L_pie_array[Omega_L_index];
    const omega_m_value = omega_m_pie_array[omega_m_index];
    const omega_b_value = omega_b_pie_array[omega_b_index];

    document.getElementById('sliderValueOmegaL').innerText = Omega_L_value.toFixed(2);
    document.getElementById('sliderValueomegam').innerText = omega_m_value.toFixed(2);
    document.getElementById('sliderValueomegab').innerText = omega_b_value.toFixed(2);

    updateSliderBackground(Omega_L_index + 1, 'mySliderOmegaL');
    updateSliderBackground(omega_m_index + 1, 'mySlideromegam');
    updateSliderBackground(omega_b_index + 1, 'mySlideromegab');

    updateImage(Omega_L_index + 1, omega_m_index + 1, omega_b_index + 1);
}

// Function to update image based on Omega_L, omega_m, omega_b
function updateImage(Omega_L_index, omega_m_index,omega_b_index) {
    const img = document.getElementById("Dlimage");
    img.src = `class_figures/pie_chart_figures/Dl_pie_chart_OmegaL_${Omega_L_index}_omegam_${omega_m_index}_omegab_${omega_b_index}.png`;
}

// Function to initialize the sliders and their backgrounds
function initialize_pie_chart_Sliders() {
    const initialOmegaLValue = 10;
    const initialomegamValue = 10;
    const initialomegabValue = 10;
    document.getElementById('mySliderOmegaL').value = initialOmegaLValue;
    document.getElementById('mySlideromegam').value = initialomegamValue;
    document.getElementById('mySlideromegab').value = initialomegabValue;

    document.getElementById('sliderValueOmegaL').innerText = Omega_L_pie_array[initialOmegaLValue - 1].toFixed(2);
    document.getElementById('sliderValueomegam').innerText = omega_m_pie_array[initialomegamValue - 1].toFixed(2);
    document.getElementById('sliderValueomegam').innerText = omega_b_pie_array[initialomegabValue - 1].toFixed(2);

    updateSliderBackground(initialOmegaLValue, 'mySliderOmegaL');
    updateSliderBackground(initialomegamValue, 'mySlideromegam');
    updateSliderBackground(initialomegabValue, 'mySlideromegab');
}

// Call initializeSliders when the page loads
window.onload = initialize_pie_chart_Sliders;

// Function to update slider background
function updateSliderBackground(value, sliderId) {
    const slider = document.getElementById(sliderId);
    const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #7B4397 0%, #7B4397 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}
