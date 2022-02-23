import { audioPlayer, audios } from "../Audio.js"
import { canvas } from "../Canvas.js"
import { colors } from "../Color.js"
import { cursor } from "../ui/Cursor.js"
import { Enemy } from "./Enemy.js"
import { gameSession } from "./GameSession.js"
import { ExplosionEffect, LaserBeam } from "./Particle.js"
import { Bomb, Missile, Projectile } from "./Projectile.js"

enum towerState {
    IDLE
}

export enum targeting {
    FIRST, LAST, CLOSE, STRONG
}

const distanceToSq = (start: { x: number, y: number }, e: Enemy) => {
    const dx = e.x - start.x
    const dy = e.y - start.y

    return dx ** 2 + dy ** 2
}

export const getTarget = (start: {x: number, y: number}, validEnemies: Array<Enemy>, targetingMode: targeting) => {
    let bestTarget = validEnemies[0]

    switch (targetingMode) {
        case targeting.FIRST:
            validEnemies.forEach(e => {
                if (e.distance > bestTarget.distance) {
                    bestTarget = e
                }
            })
            break
        case targeting.LAST:
            validEnemies.forEach(e => {
                if (e.distance < bestTarget.distance) {
                    bestTarget = e
                }
            })
            break
        case targeting.STRONG:
            validEnemies.forEach(e => {
                if (e.health < bestTarget.health) {
                    bestTarget = e
                }
            })
            break
        case targeting.CLOSE:
            validEnemies.forEach(e => {
                if (distanceToSq(start, e) < distanceToSq(start, bestTarget)) {
                    bestTarget = e
                }
            })
            break
        default:
            null
    }

    return bestTarget
}

export const getAngle = (start: {x: number, y:number}, finish: {x: number, y: number}) => {
    let theta = 0
    if (finish.x > start.x) {
        theta = Math.atan(
            (start.y - finish.y) / (start.x - finish.x)
        )
    } else if (finish.x < start.x) {
        theta = Math.PI + Math.atan(
            (start.y - finish.y) / (start.x - finish.x)
        )
    } else {
        if (finish.y > start.y) {
            theta = Math.PI / 2
        } else {
            theta = 3 * Math.PI / 2
        }
    }
    return theta
}

export class Tower {

    x: number
    y: number
    size = 10
    theta: number
    state = towerState.IDLE 
    fireTimer = 0

    range = 50
    fireRate = 10

    projectileSpeed = 0
    projectilePierce = 0
    projectileDamage = 0
    projectileLifespan = 0
    projectileSize = 0
    
    color = colors.SOLID
    targeting: targeting

    isHover = false
    isSelected = false
    lookingAt: Enemy

    constructor(x=0, y=0) {
        this.x = x
        this.y = y
        this.theta = 0
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 8, 3, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 8, 0, 3, this.color)

        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }

    drawRange() {
        canvas.strokeCircle(this.x, this.y, this.range, colors.ULTRABRIGHT, 1)
    }

    getValidEnemies(): Array<Enemy> {
        return gameSession.enemies.filter(e => {
            if (this.distanceToSq(e) < (this.range + (e.size / 2)) ** 2) {
                return true
            }
            return false
        })
    }

    distanceToSq(e: Enemy) {
        const dx = e.x - this.x
        const dy = e.y - this.y

        return dx ** 2 + dy ** 2
    }

    target() {
        const validEnemies = this.getValidEnemies()

        if (validEnemies.length == 0) {
            this.lookingAt = null
            return
        }

        const bestTarget = getTarget(this, validEnemies, this.targeting)

        this.lookAt(bestTarget)
        this.lookingAt = bestTarget
    }

    lookAt(e: Enemy) {
        this.theta = getAngle(this, e)
    }

    fire() {
        gameSession.addProjectile(new Projectile(this.x, this.y, this.theta, 
            this.projectileSpeed,
            this.projectilePierce,
            this.projectileDamage,
            this.projectileLifespan,
            this.projectileSize
            ))
        audioPlayer.playAudio(audios.SHOOT)
    }

    update() {
        this.color = this.isHover || this.isSelected ? colors.ULTRABRIGHT : colors.SOLID

        const dx = Math.abs(cursor.x - this.x)
        const dy = Math.abs(cursor.y - this.y)
        if (dx < this.size / 2 && dy < this.size / 2) {
            this.isHover = true

            if (cursor.click) {
                audioPlayer.playAudio(audios.OPEN)
                gameSession.setSelectedTower(this)
            }
            
        } else {
            this.isHover = false
        }
        
        if (this.fireTimer <= 0) {
            this.target()
            if (this.lookingAt != null) {
                this.fire()
                this.fireTimer = this.fireRate
            }
        } else {
            this.fireTimer--
        }
    }
}

class ShootTower extends Tower {
    constructor(x=0, y=0) {
        super(x, y)
        this.projectileSpeed = 9
        this.projectilePierce = 2
        this.projectileDamage = 1
        this.projectileLifespan = 30
        this.projectileSize = 8
        this.range = 80
        this.fireRate = 25
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 8, 3, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 8, 0, 3, this.color)
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class Monkey extends Tower {
    constructor(x = 0, y = 0) {
        super(x, y)
        this.projectileSpeed = 9
        this.projectilePierce = 1
        this.projectileDamage = 1
        this.projectileLifespan = 20
        this.projectileSize = 8
        this.range = 60
        this.fireRate = 2
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 6, 3, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 6, 3, 3, this.color, "square")
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class LaserTower extends Tower {
    constructor(x=0, y=0) {
        super(x, y)
        this.fireRate = 15
        this.range = 60
        this.projectileDamage = 3
    }

    fire(): void {
        if (this.lookingAt != null) {
            gameSession.addParticle(new LaserBeam(this.x, this.y, this.lookingAt.x, this.lookingAt.y))
            gameSession.addParticle(new ExplosionEffect(this.lookingAt.x, this.lookingAt.y, 10, 5))
            audioPlayer.playAudio(audios.SHOOTLASER)
            this.lookingAt.addHit(new Projectile(this.x, this.y, 0, 0, 1, this.projectileDamage, 1, 1))
        }
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 8, 0, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 8, 0, 3, this.color)
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class LaserSniper extends LaserTower {
    constructor(x=0, y=0) {
        super(x, y)
        this.fireRate = 45
        this.range = 300
        this.projectileDamage = 8
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 12, 0, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 12, 0, 3, this.color)
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class BombTower extends Tower {
    explosionSize: number

    constructor(x=0, y=0) {
        super(x, y)
        this.fireRate = 60
        this.projectileSpeed = 2
        this.projectilePierce = 25
        this.projectileDamage = 1
        this.projectileLifespan = 90
        this.projectileSize = 10
        this.explosionSize = 30
        this.range = 45
    }

    fire(): void {
        if (this.lookingAt != null) {
            gameSession.addProjectile(new Bomb(this.x, this.y, this.theta, 
                this.projectileSpeed, 
                this.projectilePierce, 
                this.projectileDamage, 
                this.projectileLifespan, 
                this.explosionSize, 
                this.projectileSize
                ))
        }
        audioPlayer.playAudio(audios.SHOOT)
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 7, 0, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 7, 2, 5, this.color, "square", "round")
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class MissileTower extends BombTower {
    constructor(x = 0, y = 0) {
        super(x, y)
        this.fireRate = 30
        this.projectileSpeed = 8
        this.projectilePierce = 35
        this.projectileDamage = 3
        this.projectileLifespan = 240
        this.projectileSize = 10
        this.explosionSize = 40
        this.range = 110
    }

    fire(): void {
        if (this.lookingAt != null) {
            gameSession.addProjectile(new Missile(this.x, this.y, this.theta,
                this.projectileSpeed,
                this.projectilePierce,
                this.projectileDamage,
                this.projectileLifespan,
                this.explosionSize,
                this.projectileSize,
                this.lookingAt,
                this.targeting

            ))
        }
        audioPlayer.playAudio(audios.SHOOT)
    }

    draw() {
        canvas.arrowDeg(this.x, this.y, this.theta, 10, 0, 3, this.color, "square")
        canvas.arrowDeg(this.x, this.y, this.theta + Math.PI, 10, 2, 5, this.color, "square", "round")
        canvas.strokeCircle(this.x, this.y, this.size / 2, this.color, 1)
    }
}

class TowerGenerator {
    towerData = {}
    availableTowers = []
    numTowers = 0

    addTowerData(tower: new () => Tower, basePrice: number, name: towerNames) {
        this.towerData[name] = {
            tower: tower,
            basePrice: basePrice,
            data: new tower()
        }

        this.availableTowers.push(name)
        this.numTowers++
    }

    getTower(towerName: towerNames, x=0, y=0): Tower {
        return new this.towerData[towerName].tower(x, y)
    }

    getRange(towerName: towerNames): number {
        return this.towerData[towerName].data.range
    }

    getBasePrice(towerName: towerNames): number {
        return this.towerData[towerName].basePrice
    }
}

export enum towerNames {
    SHOOT = "SHOOT",
    BOMB = "BOMB",
    LASER = "LASER",
    MONKEY = "MONKEY",
    SNIPER = "SNIPER",
    MISSILE = "MISSILE"
}

const towerGenerator = new TowerGenerator()
towerGenerator.addTowerData(ShootTower, 200, towerNames.SHOOT)
towerGenerator.addTowerData(BombTower, 400, towerNames.BOMB)
towerGenerator.addTowerData(LaserTower, 600, towerNames.LASER)
towerGenerator.addTowerData(Monkey, 1000, towerNames.MONKEY)
towerGenerator.addTowerData(LaserSniper, 1000, towerNames.SNIPER)
towerGenerator.addTowerData(MissileTower, 1000, towerNames.MISSILE)
export { towerGenerator }