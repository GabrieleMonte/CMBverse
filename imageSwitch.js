// Neutrino effective values array (rounded to 2 decimal places)
const N_eff_array = [0.1, 0.17, 0.24, 0.31, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72, 0.79, 0.86, 0.92, 0.99, 1.06, 1.13, 1.2, 1.27, 1.34, 1.41, 1.47, 1.54, 1.61, 1.68, 1.75, 1.82, 1.89, 1.96, 2.02, 2.09, 2.16, 2.23, 2.3, 2.37, 2.44, 2.51, 2.57, 2.64, 2.71, 2.78, 2.85, 2.92, 2.99, 3.05, 3.12, 3.19, 3.26, 3.33, 3.4, 3.47, 3.53, 3.6, 3.67, 3.74, 3.81, 3.88, 3.95, 4.01, 4.08, 4.15, 4.22, 4.29, 4.36, 4.43, 4.5, 4.56, 4.63, 4.7, 4.77, 4.84, 4.91, 4.98, 5.04, 5.11, 5.18, 5.25, 5.32, 5.39, 5.46, 5.52, 5.59, 5.66, 5.73, 5.8, 5.87, 5.94, 6.0, 6.07, 6.14, 6.21, 6.28, 6.35, 6.42, 6.49, 6.55, 6.62, 6.69, 6.76, 6.83, 6.9];
const ns_array = [0.8,  0.84, 0.87, 0.91, 0.94, 0.98, 1.01, 1.05, 1.09, 1.12, 1.16, 1.19, 1.23, 1.26, 1.3, 1.33, 1.37, 1.4, 1.44, 1.47, 1.51, 1.54, 1.58, 1.61, 1.65, 1.68, 1.72, 1.75, 1.79, 1.82, 1.86]
const ln1010As_array = [1.95, 2.11, 2.27, 2.44, 2.6, 2.77, 2.93, 3.1, 3.26, 3.43, 3.59, 3.76, 3.92, 4.08, 4.25, 4.41, 4.57, 4.73, 4.89, 5.05, 5.21, 5.37, 5.53, 5.69, 5.85, 6.01, 6.17, 6.33, 6.49, 6.65, 6.81, 6.97, 7.13, 7.29, 7.45, 7.61, 7.77, 7.93]
const m_nus_array = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]
const Omega_L_pie_array = [0.409, 0.44 , 0.471, 0.502, 0.533, 0.564, 0.596, 0.627, 0.658, 0.689, 0.72 , 0.751, 0.782, 0.813, 0.844, 0.876, 0.907, 0.938, 0.969]
const omega_m_pie_array = [0.099, 0.104, 0.109, 0.113, 0.118, 0.123, 0.128, 0.133, 0.138, 0.142, 0.147, 0.152, 0.157, 0.162, 0.167, 0.171, 0.176, 0.181, 0.186]
const omega_b_pie_array = [0.0154, 0.0162, 0.017 , 0.0178, 0.0185, 0.0193, 0.0201, 0.0209, 0.0216, 0.0224, 0.0232, 0.024 , 0.0248, 0.0255, 0.0263, 0.0271, 0.0279, 0.0286, 0.0294]
const tau_reio_pie_array = [0.0206,  0.02454, 0.02849, 0.03243, 0.03638, 0.04032, 0.04427, 0.04821, 0.05216, 0.0561,  0.06004, 0.06399, 0.06793, 0.07188, 0.07582, 0.07977, 0.08371, 0.08766, 0.0916 ]
const A_s_pie_array = [2.977, 2.985, 2.993, 3., 3.008, 3.016, 3.024, 3.031, 3.039, 3.047, 3.055, 3.063, 3.07,  3.078, 3.086, 3.094, 3.101, 3.109, 3.117]
const n_s_pie_array = [0.9475, 0.9496, 0.9517, 0.9538, 0.9559, 0.9581, 0.9602, 0.9623, 0.9644, 0.9665, 0.9686, 0.9707, 0.9728, 0.9749, 0.9771, 0.9792, 0.9813, 0.9834, 0.9855]
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
    img.src = 'class_figures/Neutrino_Nnu1_images/Dl_damping_Neff_v' + value + '.png';
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



// Function to update pie chart (omega_m, omega_b, Omega_L) and change image
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
    const img = document.getElementById("Dlimage2");
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

// Function to update pie chart (omega_m, omega_b, Omega_L) and change image
function updateCombinedValue2() {
    const A_s_index = document.getElementById('mySliderPieAs').value - 1;
    const n_s_index = document.getElementById('mySliderPiens').value - 1;
    const tau_reio_index = document.getElementById('mySliderPietau').value - 1;
    const A_s_value = A_s_pie_array[A_s_index];
    const n_s_value = n_s_pie_array[n_s_index];
    const tau_reio_value = tau_reio_pie_array[tau_reio_index];

    document.getElementById('sliderValuePieAs').innerText = A_s_value.toFixed(2);
    document.getElementById('sliderValuePiens').innerText = n_s_value.toFixed(2);
    document.getElementById('sliderValuePietau').innerText = tau_reio_value.toFixed(2);

    updateSliderBackground(A_s_index + 1, 'mySliderPieAs');
    updateSliderBackground(n_s_index + 1, 'mySliderPiens');
    updateSliderBackground(tau_reio_index + 1, 'mySliderPietau');

    updateImage(A_s_index + 1, n_s_index + 1, tau_reio_index + 1);
}

// Function to update image based on Omega_L, omega_m, omega_b
function updateImage2(A_s_index, n_s_index,tau_reio_index) {
    const img = document.getElementById("Dlimage");
    img.src = `class_figures/prim_figures/Dl_prim_tau_reio_${tau_reio_index}_As_${A_s_index}_ns_${n_s_index}.png`;
}

// Function to initialize the sliders and their backgrounds
function initialize_pie_chart_Sliders_2() {
    const initialAsValue = 10;
    const initialnsValue = 10;
    const initialtauValue = 10;
    document.getElementById('mySliderPieAs').value = initialAsValue;
    document.getElementById('mySliderPiens').value = initialnsValue;
    document.getElementById('mySliderPietau').value = initialtauValue;

    document.getElementById('sliderValuePieAs').innerText = A_s_pie_array[initialAsValue - 1].toFixed(2);
    document.getElementById('sliderValuePiens').innerText = n_s_pie_array[initialnsValue - 1].toFixed(2);
    document.getElementById('sliderValuePietau').innerText = tau_reio_pie_array[initialtauValue - 1].toFixed(2);

    updateSliderBackground2(initialAsValue, 'mySliderPieAs');
    updateSliderBackground2(initialnsValue, 'mySliderPiens');
    updateSliderBackground2(initialtauValue, 'mySliderPietau');
}

// Call initializeSliders when the page loads
window.onload = initialize_pie_chart_Sliders_2;
window.onload = initialize_pie_chart_Sliders;

// Function to update slider background
function updateSliderBackground2(value, sliderId) {
    const slider = document.getElementById(sliderId);
    const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #7B4397 0%, #7B4397 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}
function updateSliderBackground(value, sliderId) {
    const slider = document.getElementById(sliderId);
    const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #7B4397 0%, #7B4397 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}
