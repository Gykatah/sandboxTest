import {Material} from "./class/Material.js"
import {Sandbox} from "./class/Sandbox.js"

let materials = []
materials.push(new Material("lava").setColor("#ff0000").setGravity(20).setTemperature(999).setTransmutator(10))
materials.push(new Material("water").setColor("#00aaff").setGravity(2))
materials.push(new Material("air").setColor("#000000").setGravity(1))
materials.push(new Material("water2").setColor("#0055aa").setGravity(-1).setCycle(0.001))
materials.push(new Material("dirt").setColor("#ffff00").setGravity(3))
materials.push(new Material("stone").setColor("#aaaaaa").setTemperature(9))
materials.push(new Material("lightning").setColor("#ffffff"))
const sandbox = new Sandbox("game", materials);

document.querySelectorAll('input[name="item"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
        sandbox.item = event.target.value;
    });
});
const speedInput = document.getElementById("speed");
const speedLabel = document.getElementById("speedValue");

speedInput.addEventListener("input", () => {
    const value = parseFloat(speedInput.value);
    sandbox.speed = value;
    speedLabel.textContent = value.toFixed(1) + "x";
});

const sizeInput = document.getElementById("size");
const sizeLabel = document.getElementById("sizeValue");

sizeInput.addEventListener("input", () => {
    const value = parseFloat(sizeInput.value);
    sandbox.size = value;
    sizeLabel.textContent = value.toFixed(1) + "x";
});

document.getElementById("save").addEventListener("click", () => {
    document.getElementById("output").innerHTML=JSON.stringify(sandbox.map)
});
