function updateValueDL(val) {
    document.getElementById('sliderValueDL').innerText = val;
    callMyScriptDL(val);
}

function callMyScriptDL(value) {
    console.log("dl dampening slider value is: " + value);
    var img = document.getElementById("Dlimage");
    img.src = 'class_figures/Dl_Neff_damping_images/Dl_damping_Neff_v' + value + '.png';
}

function updateValuekTT(val) {
    document.getElementById('sliderValuekTT').innerText = val;
    callMyScriptkTT(val);
}

function callMyScriptkTT(value) {
    console.log("kTT slider value is: " + value);
    var img = document.getElementById("KTTImage");
    img.src = 'class_figures/kTT_phase_shift_neff_lens_images/kTT_phase_shift_Neff_v' + value + '_lens.png';
}

function updateValuekEE(val) {
    document.getElementById('sliderValuekEE').innerText = val;
    callMyScriptkEE(val);
}

function callMyScriptkEE(value) {
    console.log("kEE dampening slider value is: " + value);
    var img = document.getElementById("kEEimage");
    img.src = 'class_figures/kEE_phase_shift_neff_lens_images/kEE_phase_shift_Neff_v' + value + '_lens.png';
}
