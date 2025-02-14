// Neutrino effective values array (rounded to 2 decimal places)
const N_eff_array = [0.1, 0.17, 0.24, 0.31, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72, 0.79, 0.86, 0.92, 0.99, 1.06, 1.13, 1.2, 1.27, 1.34, 1.41, 1.47, 1.54, 1.61, 1.68, 1.75, 1.82, 1.89, 1.96, 2.02, 2.09, 2.16, 2.23, 2.3, 2.37, 2.44, 2.51, 2.57, 2.64, 2.71, 2.78, 2.85, 2.92, 2.99, 3.05, 3.12, 3.19, 3.26, 3.33, 3.4, 3.47, 3.53, 3.6, 3.67, 3.74, 3.81, 3.88, 3.95, 4.01, 4.08, 4.15, 4.22, 4.29, 4.36, 4.43, 4.5, 4.56, 4.63, 4.7, 4.77, 4.84, 4.91, 4.98, 5.04, 5.11, 5.18, 5.25, 5.32, 5.39, 5.46, 5.52, 5.59, 5.66, 5.73, 5.8, 5.87, 5.94, 6.0, 6.07, 6.14, 6.21, 6.28, 6.35, 6.42, 6.49, 6.55, 6.62, 6.69, 6.76, 6.83, 6.9];
const N_eff_array2= [1., 1.04, 1.08, 1.12, 1.16, 1.19, 1.23, 1.27, 1.31, 1.35, 1.39, 1.43, 1.47, 1.5, 1.54, 1.58, 1.62, 1.66, 1.7,  1.74, 1.78, 1.81, 1.85, 1.89, 1.93, 1.97, 2.01, 2.05, 2.09, 2.12, 2.16, 2.2,  2.24, 2.28, 2.32, 2.36, 2.4,  2.43, 2.47, 2.51, 2.55, 2.59, 2.63, 2.67, 2.71, 2.74, 2.78, 2.82, 2.86, 2.9,  3.1,  3.16, 3.22, 3.28, 3.34, 3.4, 3.46, 3.51, 3.57, 3.63, 3.69, 3.75, 3.81, 3.87, 3.93, 3.99, 4.05, 4.11, 4.17, 4.22, 4.28, 4.34, 4.4,  4.46, 4.52, 4.58, 4.64, 4.7,  4.76, 4.82, 4.88, 4.93, 4.99, 5.05, 5.11, 5.17, 5.23, 5.29, 5.35, 5.41, 5.47, 5.53, 5.59, 5.64, 5.7,  5.76, 5.82, 5.88, 5.94, 6.  ]
const ns_array = [0.8,  0.84, 0.87, 0.91, 0.94, 0.98, 1.01, 1.05, 1.09, 1.12, 1.16, 1.19, 1.23, 1.26, 1.3, 1.33, 1.37, 1.4, 1.44, 1.47, 1.51, 1.54, 1.58, 1.61, 1.65, 1.68, 1.72, 1.75, 1.79, 1.82, 1.86]
const ln1010As_array = [1.95, 2.11, 2.27, 2.44, 2.6, 2.77, 2.93, 3.1, 3.26, 3.43, 3.59, 3.76, 3.92, 4.08, 4.25, 4.41, 4.57, 4.73, 4.89, 5.05, 5.21, 5.37, 5.53, 5.69, 5.85, 6.01, 6.17, 6.33, 6.49, 6.65, 6.81, 6.97, 7.13, 7.29, 7.45, 7.61, 7.77, 7.93]
const m_nus_array = [0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]
const Omega_L_pie_array = [0.409, 0.44 , 0.471, 0.502, 0.533, 0.564, 0.596, 0.627, 0.658, 0.689, 0.72 , 0.751, 0.782, 0.813, 0.844, 0.876, 0.907, 0.938, 0.969]
const omega_m_pie_array = [0.099, 0.104, 0.109, 0.113, 0.118, 0.123, 0.128, 0.133, 0.138, 0.142, 0.147, 0.152, 0.157, 0.162, 0.167, 0.171, 0.176, 0.181, 0.186]
const omega_b_pie_array = [0.0154, 0.0162, 0.017 , 0.0178, 0.0185, 0.0193, 0.0201, 0.0209, 0.0216, 0.0224, 0.0232, 0.024 , 0.0248, 0.0255, 0.0263, 0.0271, 0.0279, 0.0286, 0.0294]
const tau_reio_pie_array = [0.0064, 0.0188, 0.0312, 0.0437, 0.0561, 0.0632, 0.0948, 0.1265, 0.1581, 0.1897, 0.2213, 0.253,  0.2846, 0.3162, 0.3478, 0.3795, 0.4111]
const ln1010A_s_pie_array = [1.647, 1.822, 1.997, 2.172, 2.347, 2.522, 2.697, 2.872, 3.047, 3.222, 3.397, 3.572, 3.747, 3.922, 4.097, 4.272, 4.447]
const n_s_pie_array = [0.5865, 0.634,  0.6815, 0.729,  0.7765, 0.824,  0.8715, 0.919,  0.9665, 1.014, 1.0615, 1.109,  1.1565, 1.204,  1.2515, 1.299,  1.3465]
const omega_b_array_DMpage = [0.0224, 0.0248, 0.0273, 0.0297, 0.0322, 0.0346, 0.0371, 0.0395, 0.042, 0.0444, 0.0469, 0.0493, 0.0518, 0.0542, 0.0567, 0.0592, 0.0616, 0.0641, 0.0665, 0.069, 0.0714, 0.0739, 0.0763, 0.0788, 0.0812, 0.0837, 0.0861, 0.0886, 0.091, 0.0935, 0.0959, 0.0984, 0.1008, 0.1033, 0.1057, 0.1082, 0.1106, 0.1131, 0.1155, 0.118, 0.1204, 0.1229, 0.1253, 0.1278, 0.1302, 0.1327, 0.1351, 0.1376, 0.14, 0.1425]
const tau_reio_array_page = [0.00173814, 0.00717433, 0.01261051, 0.0180467,  0.02348288, 0.02891907, 0.03435526, 0.03979144, 0.04522763, 0.05066381, 0.0561, 0.06153619, 0.06697237, 0.07240856, 0.07784474, 0.08328093, 0.08871712, 0.0941533, 0.09958949, 0.10502567, 0.11046186, 0.11589805, 0.12133423, 0.12677042, 0.1322066,  0.13764279, 0.14307898, 0.14851516, 0.15395135, 0.15938753, 0.16482372]
const omega_cdm_array_DMpage = [0., 0.0029, 0.0058, 0.0087, 0.0116, 0.0145, 0.0174, 0.0204, 0.0233, 0.0262, 0.0291, 0.032,  0.0349, 0.0378, 0.0407, 0.0436, 0.0465, 0.0494, 0.0523, 0.0553, 0.0582, 0.0611, 0.064,  0.0669, 0.0698, 0.0727, 0.0756, 0.0785, 0.0814, 0.0843, 0.0872, 0.0901, 0.0931, 0.096,  0.0989, 0.1018, 0.1047, 0.1076, 0.1105, 0.1134, 0.1163, 0.1192, 0.1221, 0.125,  0.128,  0.1309, 0.1338, 0.1367, 0.1396, 0.1425]
const Omega_k_array = [-0.200, -0.186, -0.172, -0.159, -0.145, -0.131, -0.117, -0.103, -0.090, -0.076, -0.062, -0.048, -0.034, -0.021, -0.007, 0.000, 0.007, 0.021, 0.034, 0.048, 0.062, 0.076, 0.090, 0.103, 0.117, 0.131, 0.145, 0.159, 0.172, 0.186, 0.200];
const Omega_L_array = [0.100, 0.128, 0.155, 0.183, 0.210, 0.238, 0.266, 0.293, 0.321, 0.348, 0.376, 0.403, 0.431, 0.459, 0.486, 0.514, 0.541, 0.569, 0.597, 0.624, 0.652, 0.679, 0.707, 0.734, 0.762, 0.790, 0.817, 0.845, 0.872, 0.900]
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

function updateValueNnu1(val) {
    const N_eff_value1 = N_eff_array[val - 1];
    document.getElementById('sliderValueNnu1').innerText = N_eff_value1.toFixed(2);
    callMyScriptNnu1(val);
}

function callMyScriptNnu1(value) {
    console.log("Nnu1 slider value is: " + value);
    var img = document.getElementById("Nnu1image");
    img.src = 'class_figures/Neutrino_Nnu1_images/Dl_damping_Neff_v' + value + '.png';
}


function updateValueNnu2(val) {
    const N_eff_value2 = N_eff_array2[val - 1];
    document.getElementById('sliderValueNnu2').innerText = N_eff_value2.toFixed(2);
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

//function to update omega_cdm value in DM page
function updateValue_omega_cdm(val){
    const omega_cdm_value = omega_cdm_array_DMpage[val-1];
    document.getElementById('sliderValueomega_cdm_DMpage').innerText = omega_cdm_value.toFixed(4);
    callMyScript_omega_cdm_DMpage(val)
}

// function to update omega_cdm image in DM page
function callMyScript_omega_cdm_DMpage(value){
    console.log('omega_cdm slider value is: ' + value);
    var img = document.getElementById('imageomegacdmDMpage');
    img.src = 'class_figures/omega_cdm_images/Dl_omega_cdm_v' + value + '.png';
}

//function to update omega_L value in dark energy page
function updateValue_Omega_L(value){
    const Omega_L_value = Omega_L_array[value-1]
    document.getElementById('sliderValue_Omega_L').innerText = Omega_L_value.toFixed(2);
    callMyScript_Omega_L(value);
}

//function to update omega_L image in dark energy page
function callMyScript_Omega_L(value){
    console.log('Omega_L slider value is: ' + value);
    var img = document.getElementById('Omega_L_image');
    img.src = 'class_figures/Omega_L_Figures_New/Dl_omega_L_v' + value + '.png';
}


//function to update omega_k value in curavture page
function updateValue_Omega_k(val){
    const Omega_k_value = Omega_k_array[val-1];
    document.getElementById('sliderValueOmega_k').innerText = Omega_k_value.toFixed(2);
    callMyScript_Omega_k(val);
}

//function to update omega_k image in curvature page
function callMyScript_Omega_k(value){
    console.log('Omega_k slider value is: ' + value);
    var img = document.getElementById('Omega_k_image');
    img.src = 'class_figures/Omega_k_figures/Dl_Omega_k_' + value + '.png';
}

//function to update omega_b value in DM page
function updateValue_omega_b(val){
    const omega_b_value = omega_b_array_DMpage[val-1];
    document.getElementById('sliderValueomega_b_DMpage').innerText = omega_b_value.toFixed(4);
    callMyScript_omega_b_DMpage(val)
}

// function to update omega_b image in DM page
function callMyScript_omega_b_DMpage(value){
    console.log('omega_b slider value is: ' + value);
    var img = document.getElementById('imageomegabDMpage');
    img.src = 'class_figures/DM_aeq_fixed_figures/Dl_DM_aeq_fixed__omega_b_' + value + '.png';
}

//function to update tau_ value in Photon depth page
function updateValue_tau_(val){
    const tau__value = tau__array_page[val-1];
    document.getElementById('sliderValuetau_page').innerText = tau__value.toFixed(4);
    callMyScript_tau__page(val)
}

// function to update tau_ image in Photon depth page
function callMyScript_tau__page(value){
    console.log('tau_ slider value is: ' + value);
    var img = document.getElementById('imagetau_page');
    img.src = 'class_figures/tau_reionization_figures/Dl_tau__' + value + '.png';

}

//function to update tau_degen value in Photon depth page
function updateValue_tau_degen(val){
    const tau_degen_value = tau_degen_array_page[val-1];
    document.getElementById('sliderValuetau_degen_page').innerText = tau_degen_value.toFixed(4);
    callMyScript_tau_degen_page(val)
}

// function to update tau_degen image in Photon depth page
function callMyScript_tau_degen_page(value){
    console.log('tau_degen slider value is: ' + value);
    var img = document.getElementById('imagetau_degen_page');
    img.src = 'class_figures/tau_reionization_figures/Dl_tau_degen_' + value + '.png';

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
    document.getElementById('sliderValueomegam').innerText = omega_m_value.toFixed(4);
    document.getElementById('sliderValueomegab').innerText = omega_b_value.toFixed(4);

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
    document.getElementById('sliderValueomegam').innerText = omega_m_pie_array[initialomegamValue - 1].toFixed(4);
    document.getElementById('sliderValueomegam').innerText = omega_b_pie_array[initialomegabValue - 1].toFixed(4);

    updateSliderBackground(initialOmegaLValue, 'mySliderOmegaL');
    updateSliderBackground(initialomegamValue, 'mySlideromegam');
    updateSliderBackground(initialomegabValue, 'mySlideromegab');
}
function initialize_Nnu1_slider() {
    const initialNnu1Value = 44;
    document.getElementById('mySliderNnu1').value = initialNnu1Value;

    document.getElementById('sliderValueNnu1').innerText = N_eff_array[initialNnu1Value - 1].toFixed(2);

    updateSliderBackground(initialNnu1Value, 'mySliderNnu1');
}
function initialize_Nnu2_slider() {
    const initialNnu2Value = 51;
    document.getElementById('mySliderNnu2').value = initialNnu2Value;

    document.getElementById('sliderValueNnu2').innerText = N_eff_array2[initialNnu2Value - 1].toFixed(2);

    updateSliderBackground(initialNnu2Value, 'mySliderNnu2');
}

function initialize_tau_reio_slider() {
    const initialtauValue = 11;
    document.getElementById('mySlidertau_reiopage').value = initialtauValue;

    document.getElementById('sliderValuetau_reiopage').innerText = tau_reio_array_page[initialtauValue - 1].toFixed(4);

    updateSliderBackground(initialtauValue, 'mySlidertau_reiopage');
}

function initialize_Omega_L_slider() {
    const initialLValue = 22;
    document.getElementById('slideValue_Omega_L').value = initialLValue;

    document.getElementById('sliderValue_Omega_L').innerText = Omega_L_array[initialLValue - 1].toFixed(2);

    updateSliderBackground(initialLValue, 'slideValue_Omega_L');
}

// Function to update pie chart (omega_m, omega_b, Omega_L) and change image
function updateCombinedValue2() {
    const A_s_index = document.getElementById('mySliderPieAs').value - 1;
    const n_s_index = document.getElementById('mySliderPiens').value - 1;
    const tau_reio_index = document.getElementById('mySliderPietau').value - 1;
    const A_s_value = ln1010A_s_pie_array[A_s_index];
    const n_s_value = n_s_pie_array[n_s_index];
    const tau_reio_value = tau_reio_pie_array[tau_reio_index];

    document.getElementById('sliderValuePieAs').innerText = A_s_value.toFixed(2);
    document.getElementById('sliderValuePiens').innerText = n_s_value.toFixed(3);
    document.getElementById('sliderValuePietau').innerText = tau_reio_value.toFixed(4);

    updateSliderBackground(A_s_index + 1, 'mySliderPieAs');
    updateSliderBackground(n_s_index + 1, 'mySliderPiens');
    updateSliderBackground(tau_reio_index + 1, 'mySliderPietau');

    updateImage2(A_s_index + 1, n_s_index + 1, tau_reio_index + 1);
}

// Function to update image based on Omega_L, omega_m, omega_b
function updateImage2(A_s_index, n_s_index,tau_reio_index) {
    const img = document.getElementById("Dlimage2");
    img.src = `class_figures/prim_figures/Dl_prim_tau_reio_${tau_reio_index}_As_${A_s_index}_ns_${n_s_index}.png`;
}

// Function to initialize the sliders and their backgrounds
function initialize_pie_chart_Sliders_2() {
    const initialAsValue = 9;
    const initialnsValue = 9;
    const initialtauValue = 5;
    document.getElementById('mySliderPieAs').value = initialAsValue;
    document.getElementById('mySliderPiens').value = initialnsValue;
    document.getElementById('mySliderPietau').value = initialtauValue;

    document.getElementById('sliderValuePieAs').innerText = ln1010A_s_pie_array[initialAsValue - 1].toFixed(3);
    document.getElementById('sliderValuePiens').innerText = n_s_pie_array[initialnsValue - 1].toFixed(3);
    document.getElementById('sliderValuePietau').innerText = tau_reio_pie_array[initialtauValue - 1].toFixed(4);

    updateSliderBackground(initialAsValue, 'mySliderPieAs');
    updateSliderBackground(initialnsValue, 'mySliderPiens');
    updateSliderBackground(initialtauValue, 'mySliderPietau');
}

// Call initializeSliders when the page loads
window.onload = function() {
    const currentPage = window.location.pathname;

    // Check if the current page is 'index.html' or '/'
    if (currentPage.endsWith('index.html') || currentPage.endsWith('/')) {
        // Run these functions only on the index.html page
        initialize_pie_chart_Sliders();
        initialize_pie_chart_Sliders_2();
    }

    // Check if the current page is 'neutrino.html'
    if (currentPage.endsWith('neutrinos.html')) {
        // Run these functions only on the neutrino.html page
        initialize_Nnu1_slider();
        initialize_Nnu2_slider();
    }

    // Check if the current page is 'photon_depth.html'
    if (currentPage.endsWith('photon_depth.html')) {
        // Run these functions only on the neutrino.html page
        initialize_tau_reio_slider();
    }

    // Check if the current page is 'dark_energy.html'
    if (currentPage.endsWith('dark_energy.html')) {
    // Run these functions only on the dark_energy.html page
    initialize_Omega_L_slider();
    }
};

// Function to update slider background

function updateSliderBackground(value, sliderId) {
    const slider = document.getElementById(sliderId);

    // Convert values to numbers
    const min = Number(slider.min);
    const max = Number(slider.max);
    const currentValue = Number(value);

    // Calculate the correct percentage
    const percentage = ((currentValue - min) / (max - min)) * 100;

    // Log the values for debugging
    console.log(`Slider ID: ${sliderId}, Value: ${currentValue}, Min: ${min}, Max: ${max}, Percentage: ${percentage}%`);

    // Update the slider's background gradient
    slider.style.background = `linear-gradient(to right, #7B4397 0%, #7B4397 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}
