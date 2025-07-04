export class Material{
    name = ""
    color = "red";
    temperature = 0
    transmutator = 0.1
    everytick = ()=>{}
    constructor(name){
        this.name = name
        return this
    }
    setColor(newColor) {
        this.color = newColor;
        return this
    }

    getColor() {
        return this.color;
    }
    setGravity(gravity){
        this.gravity = gravity
        return this
    }
    setCycle(cycle) {
        this.cycle = cycle;
        return this;
    }
    setTemperature(cycle) {
        this.temperature = cycle;
        return this;
    }
    setTransmutator(a){
        this.transmutator = a
        return this
    }
}