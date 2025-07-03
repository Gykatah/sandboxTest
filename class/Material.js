export class Material{
    name = ""
    color = "red";
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
}