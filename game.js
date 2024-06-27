class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: "BootScene" });
	}

	preload() {
		this.load.image("space", "assets/nyan.png");
		this.load.audioSprite("sfx", "assets/audio/SoundEffects/fx_mixdown.json", [
			"assets/audio/SoundEffects/fx_mixdown.ogg",
			"assets/audio/SoundEffects/fx_mixdown.mp3",
		]);
	}

	create() {
		this.add
			.image(this.cameras.main.centerX, this.cameras.main.centerY, "space")
			.setOrigin(0.5);

		let titleText = this.add
			.text(this.cameras.main.centerX, 50, "Collecte & Esquive", {
				fontFamily: "Retro",
				fontSize: "48px",
				color: "#ffffff",
				stroke: "#000000",
				strokeThickness: 6,
			})
			.setOrigin(0.5, 0);

		// Option de démarrage du jeu en mode Solo
		let startTextSolo = this.add
			.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, "Solo", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });
		startTextSolo.on("pointerdown", () => {
			this.sound.playAudioSprite("sfx", "numkey");
			this.scene.start("MainScene", { mode: "solo" });
		});

		let startTextCoop = this.add
			.text(this.cameras.main.centerX, this.cameras.main.centerY, "Coop", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });
		startTextCoop.on("pointerdown", () => {
			this.sound.playAudioSprite("sfx", "numkey");
			this.scene.start("MainScene", { mode: "coop" });
		});

		let startTextCompet = this.add
			.text(
				this.cameras.main.centerX,
				this.cameras.main.centerY + 50,
				"Compétitif",
				{
					fontFamily: "Retro",
					fontSize: "32px",
					fill: "#FFF",
				}
			)
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });
		startTextCompet.on("pointerdown", () => {
			this.sound.playAudioSprite("sfx", "numkey");
			this.scene.start("MainScene", { mode: "compet" });
		});
		// Instructions pour J1
		let controlsJ1 = this.add.text(
			20,
			this.cameras.main.height - 60,
			"J1 : ZQSD",
			{
				fontFamily: "Retro",
				fontSize: "24px",
				color: "#ffffff",
			}
		);

		// Instructions pour J2
		let controlsJ2 = this.add
			.text(
				this.cameras.main.width - 220,
				this.cameras.main.height - 60,
				"J2 : Flèches",
				{
					fontFamily: "Retro",
					fontSize: "24px",
					color: "#ffffff",
				}
			)
			.setOrigin(0, 0);
	}
}

class MainScene extends Phaser.Scene {
	constructor() {
		super({ key: "MainScene" });
		// Variables pour les scores et les vies des joueurs
		this.scorePlayer1 = 0;
		this.scorePlayer2 = 0;
		this.livesPlayer1 = 3;
		this.livesPlayer2 = 3;
		this.globalScore = 0;
		this.gameStarted = false;
		this.obstacleSpeedFactor = 1;
		// Mode de jeu
		this.gameMode = "coop";
	}

	init(data) {
		// Réinitialisation des états et valeurs pour une nouvelle partie
		this.scorePlayer1 = 0;
		this.scorePlayer2 = 0;
		this.livesPlayer1 = 3;
		this.livesPlayer2 = 3;
		this.globalScore = 0;
		this.gameStarted = false;
		this.gameTime = 120;

		this.gameMode = data.mode || "coop";

		// Initialisation spécifique au mode de jeu
		switch (this.gameMode) {
			case "coop":
				this.lives = 3; // Initialisation pour le mode coopératif
				break;
			case "solo":
				break;
			case "compet":
				break;
			default:
				break;
		}
	}

	preload() {
		// Chargement des assets pour le joueur, l'espace, les étoiles, et le spritesheet du brawler
		this.load.image("space", "assets/nyan.png");
		this.load.image("star", "assets/star.png");
		this.load.spritesheet("brawler", "./brawler/brawler48x48.png", {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.spritesheet("obstacleSprite", "assets/slime.png", {
			frameWidth: 48,
			frameHeight: 43,
		});
		this.load.audio("megalovania", "assets/audio/Megalovania.mp3");
		this.load.audioSprite("sfx", "assets/audio/SoundEffects/fx_mixdown.json", [
			"assets/audio/SoundEffects/fx_mixdown.ogg",
			"assets/audio/SoundEffects/fx_mixdown.mp3",
		]);
		this.load.spritesheet("spaceMan", "assets/space_man.png", {
			frameWidth: 48,
			frameHeight: 48,
		});
	}

	create() {
		// Configuration initiale de la scène
		this.add
			.image(this.cameras.main.centerX, this.cameras.main.centerY, "space")
			.setOrigin(0.5);

		// Configuration des joueurs et des contrôles
		this.setupPlayersAndControls();

		// Création des animations
		this.createBrawlerAnimations();

		// Initialisation des groupes d'étoiles et d'obstacles
		this.stars = this.physics.add.group();
		this.obstacles = this.physics.add.group();

		// Timers pour générer des étoiles et des obstacles
		this.time.addEvent({
			delay: 600000,
			callback: this.spawnStar,
			callbackScope: this,
			loop: true,
		});

		this.anims.create({
			key: "obstacleAnim",
			frames: this.anims.generateFrameNumbers("obstacleSprite", {
				start: 0,
				end: 4,
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.debugGraphics = this.add.graphics();

		// Configuration de l'UI et des interactions
		this.setupUI();
		this.setupInteractions();

		// Timer de jeu
		this.setupTimer();
		// Affichage du texte du compte à rebours
		this.countdownText = this.add
			.text(this.cameras.main.centerX, this.cameras.main.centerY, "3", {
				fontFamily: "Retro",
				fontSize: "64px",
				fill: "#FFF",
			})
			.setOrigin(0.5, 0.5);

		// Démarre le compte à rebours
		this.startCountdown();
	}

	startCountdown() {
		let countdown = 3;
		this.time.addEvent({
			delay: 1000,
			callback: () => {
				countdown--;
				this.countdownText.setText(countdown.toString());
				if (countdown <= 0) {
					this.countdownText.setVisible(false);
					this.startGame();
				}
			},
			repeat: 2,
		});
	}

	setupTimersForStarsAndObstacles() {
		// Vérifie si les timers existent déjà et les supprime pour éviter les doublons
		if (this.starTimerEvent) this.starTimerEvent.remove();
		if (this.obstacleTimerEvent) this.obstacleTimerEvent.remove();
	}

	cleanUpTimers() {
		if (this.starTimerEvent) {
			this.starTimerEvent.remove();
			this.starTimerEvent = null;
		}
		if (this.obstacleTimerEvent) {
			this.obstacleTimerEvent.remove();
			this.obstacleTimerEvent = null;
		}
	}

	startGame() {
		// Arrêt de la musique si elle joue déjà
		if (this.bgMusic && this.bgMusic.isPlaying) {
			this.bgMusic.stop();
		}

		// Jouer la musique de fond seulement si elle n'est pas déjà en train de jouer
		if (!this.bgMusic || !this.bgMusic.isPlaying) {
			this.bgMusic = this.sound.add("megalovania", {
				volume: 0.5,
				loop: true,
			});
			this.bgMusic.play();
		}
		if (this.countdownText) {
			this.countdownText.setText(""); // Ou le cacher
		}
		if (this.scoreText) {
			this.scoreText.setText("Score: 0");
		}
		this.cleanUpTimers();
		this.gameStarted = true;
		// Réinitialiser le score si nécessaire
		this.scorePlayer1 = 0;
		this.scorePlayer2 = 0;
		// Mettre à jour le texte du score
		if (this.gameMode === "solo" || this.gameMode === "coop") {
			if (this.scoreText) {
				this.scoreText.setText("Score: 0");
			}
		} else if (this.gameMode === "compet") {
			this.scoreTextPlayer1.setText("Score P1: 0");
			this.scoreTextPlayer2.setText("Score P2: 0");
		}

		// Réinitialiser les positions des joueurs, si nécessaire
		this.player1.setPosition(400, 300);
		if (this.player2) {
			this.player2.setPosition(450, 300);
		}

		this.player1.setActive(true).setVisible(true);
		if (this.player2) {
			this.player2.setActive(true).setVisible(true);
		}

		this.time.addEvent({
			delay: 25000,
			callback: () => {
				this.obstacleSpeedFactor += 0.5;
			},
			loop: true,
		});

		// Réinitialiser ou démarrer des timers ou des événements périodiques
		// Par exemple, démarrer ou redémarrer la génération d'étoiles et d'obstacles
		this.setupTimersForStarsAndObstacles();

		this.spawnObstacleWithDecreasingDelay(20000);
	}

	spawnObstacleWithDecreasingDelay(
		delay,
		minDelay = 1000,
		decreaseAmount = 250
	) {
		this.spawnObstacle();

		let newDelay = Math.max(delay - decreaseAmount, minDelay);

		this.time.delayedCall(newDelay, () => {
			this.spawnObstacleWithDecreasingDelay(newDelay, minDelay, decreaseAmount);
		});
	}

	createUI() {
		// Affichage conditionnel selon le mode de jeu
		if (this.gameMode === "solo" || this.gameMode === "coop") {
			this.scoreText = this.add.text(16, 16, "Score: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		} else if (this.gameMode === "compet") {
			this.scoreTextPlayer1 = this.add.text(16, 16, "Score P1: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
			this.scoreTextPlayer2 = this.add.text(16, 48, "Score P2: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		}

		this.livesTextPlayer1 = this.add.text(650, 16, "Lives P1: 3", {
			fontFamily: "Retro",
			fontSize: "32px",
			fill: "#FFF",
		});
		if (this.gameMode !== "solo") {
			this.livesTextPlayer2 = this.add.text(650, 48, "Lives P2: 3", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		}

		this.timerText = this.add.text(16, 80, "Time: 120", {
			fontFamily: "Retro",
			fontSize: "32px",
			fill: "#FFF",
		});
	}

	setupInteractions() {
		this.physics.add.overlap(
			this.player1,
			this.stars,
			this.collectStar,
			null,
			this
		);
		this.physics.add.collider(
			this.player1,
			this.obstacles,
			this.hitObstacle,
			null,
			this
		);

		if (this.gameMode !== "solo") {
			this.physics.add.overlap(
				this.player2,
				this.stars,
				this.collectStar,
				null,
				this
			);
			this.physics.add.collider(
				this.player2,
				this.obstacles,
				this.hitObstacle,
				null,
				this
			);
		}
	}

	setupPlayersAndControls() {
		this.player1 = this.physics.add
			.sprite(400, 300, "brawler")
			.setScale(1)
			.setCollideWorldBounds(true);
		this.cursors = this.input.keyboard.createCursorKeys();
		this.player1.anims.play("idle", true);

		// Configuration spécifique selon le mode de jeu
		if (this.gameMode !== "solo") {
			this.player2 = this.physics.add
				.sprite(450, 300, "brawler")
				.setScale(1)
				.setCollideWorldBounds(true);
			this.zqsd = {
				up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
				down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
				right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
			};
			this.player2.anims.play("idle", true);
		} else {
			this.player2 = undefined;
		}
	}

	setupUI() {
		// Configuration de l'UI en fonction du mode de jeu
		if (this.gameMode === "solo") {
			this.scoreText = this.add.text(16, 16, "Score: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
			this.livesTextPlayer1 = this.add.text(650, 16, "Vies: 3", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		} else if (this.gameMode === "coop") {
			this.globalScoreText = this.add.text(16, 16, "Score Global: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});

			this.livesText = this.add.text(650, 16, "Vies: 3", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		} else if (this.gameMode === "compet") {
			this.scoreTextPlayer1 = this.add.text(16, 16, "Score P1: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
			this.scoreTextPlayer2 = this.add.text(16, 48, "Score P2: 0", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
			this.livesTextPlayer1 = this.add.text(650, 16, "Vies P1: 3", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
			this.livesTextPlayer2 = this.add.text(650, 48, "Vies P2: 3", {
				fontFamily: "Retro",
				fontSize: "32px",
				fill: "#FFF",
			});
		}

		this.gameTime = 120;
		this.timerText = this.add.text(16, 80, "Temps: 120", {
			fontFamily: "Retro",
			fontSize: "32px",
			fill: "#FFF",
		});
	}

	setupTimer() {
		// Génère des étoiles avec un intervalle aléatoire entre chaque apparition
		this.time.addEvent({
			delay: Phaser.Math.Between(4000, 6000),
			callback: () => {
				this.spawnStar();
			},
			callbackScope: this,
			loop: true,
		});

		// Génère des obstacles plus progressivement et partout sur la map
		this.time.addEvent({
			delay: Phaser.Math.Between(2500, 4000),
			callback: () => {
				this.spawnObstacle();
			},
			callbackScope: this,
			loop: true,
		});

		this.time.addEvent({
			delay: 1000,
			callback: () => {
				this.gameTime -= 1;
				this.timerText.setText("Temps: " + this.gameTime);
				if (this.gameTime <= 0) {
					this.endGame();
				}
			},
			loop: true,
		});
	}

	update() {
		if (!this.gameStarted) {
			return;
		}

		this.updatePlayerMovement(this.player1, this.cursors);

		if (this.gameMode !== "solo" && this.player2 && this.zqsd) {
			this.updatePlayerMovement(this.player2, this.zqsd);
		}

		this.debugGraphics.clear();

		// Dessinez les hitboxes pour les joueurs
		this.drawDebugHitbox(this.player1, 0xff0000); // Rouge pour le Joueur 1
		if (this.player2) {
			this.drawDebugHitbox(this.player2, 0x0000ff); // Bleu pour le Joueur 2
		}
	}

	updatePlayerMovement(player, controls) {
		const speed = 160;
		let velocityX = 0;
		let velocityY = 0;

		// Détermination de la direction horizontale
		if (controls.left.isDown) {
			velocityX -= speed;
			player.flipX = false;
		} else if (controls.right.isDown) {
			velocityX += speed;
			player.flipX = true;
		}

		// Détermination de la direction verticale
		if (controls.up.isDown) {
			velocityY -= speed;
		} else if (controls.down.isDown) {
			velocityY += speed;
		}

		// Normalisation de la vitesse pour maintenir une vitesse constante en diagonale
		if (velocityX !== 0 && velocityY !== 0) {
			const norm = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
			velocityX = (velocityX / norm) * speed;
			velocityY = (velocityY / norm) * speed;
		}

		// Mise à jour de la vitesse du joueur
		player.setVelocity(velocityX, velocityY);

		// Mise à jour de l'animation du joueur
		if (velocityX !== 0 || velocityY !== 0) {
			player.anims.play("walk", true);
		} else {
			if (
				!player.anims.currentAnim ||
				player.anims.currentAnim.key !== "idle"
			) {
				player.anims.play("idle", true);
			}
		}
	}

	drawDebugHitbox(sprite, color) {
		if (sprite.body) {
			this.debugGraphics.lineStyle(2, color, 1);
			this.debugGraphics.strokeRect(
				sprite.body.position.x,
				sprite.body.position.y,
				sprite.body.width,
				sprite.body.height
			);
		}
	}

	createBrawlerAnimations() {
		this.anims.create({
			key: "walk",
			frames: this.anims.generateFrameNumbers("brawler", { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1,
		});

		this.anims.create({
			key: "idle",
			frames: this.anims.generateFrameNumbers("brawler", { start: 4, end: 7 }),
			frameRate: 10,
			repeat: -2,
		});
	}

	spawnStar() {
		if (!this.gameStarted) return;
		let x = Phaser.Math.Between(0, this.cameras.main.width);
		let y = Phaser.Math.Between(0, this.cameras.main.height);
		let star = this.stars.create(x, y, "star").setScale(0.1);
		star.setBounce(1, 1);
		star.setCollideWorldBounds(true);
		star.setVelocity(
			Phaser.Math.Between(-100, 200),
			Phaser.Math.Between(20, 100)
		);
	}

	spawnObstacle() {
		if (!this.gameStarted) return;

		let x = Phaser.Math.Between(0, this.cameras.main.width);
		let y = Phaser.Math.Between(0, this.cameras.main.height);
		let obstacle = this.obstacles.create(x, y, "obstacleSprite");
		obstacle.setBounce(1, 1);
		obstacle.setCollideWorldBounds(true);

		// Applique la vitesse ajustée
		let velocityX = Phaser.Math.Between(-50, 50) * this.obstacleSpeedFactor;
		let velocityY = Phaser.Math.Between(25, 75) * this.obstacleSpeedFactor;
		obstacle.setVelocity(velocityX, velocityY);

		// Démarrer l'animation si nécessaire
		obstacle.anims.play("obstacleAnim");
	}

	collectStar(player, star) {
		star.disableBody(true, true);
		this.sound.playAudioSprite("sfx", "ping");

		// Mise à jour du score selon le mode de jeu
		if (this.gameMode === "solo") {
			this.scorePlayer1 += 10;
			if (this.scoreText) {
				this.scoreText.setText("Score: " + this.scorePlayer1);
			}
		} else if (this.gameMode === "compet") {
			// Gestion des scores séparés en mode compétitif
			if (player === this.player1) {
				this.scorePlayer1 += 10;
				this.scoreTextPlayer1.setText("Score P1: " + this.scorePlayer1);
			} else if (player === this.player2) {
				this.scorePlayer2 += 10;
				this.scoreTextPlayer2.setText("Score P2: " + this.scorePlayer2);
			}
		} else if (this.gameMode === "coop") {
			this.globalScore += 10; // Mise à jour du score global
			if (this.globalScoreText) {
				this.globalScoreText.setText("Score Global: " + this.globalScore);
			}
		}
	}

	hitObstacle(player, obstacle) {
		obstacle.disableBody(true, true);
		this.sound.playAudioSprite("sfx", "alien death");
		if (this.gameMode === "coop") {
			this.lives -= 1;
			this.livesText.setText(`Vies: ${this.lives}`);

			if (this.lives <= 0) {
				this.endGame();
			}
		} else {
			// Gestion des vies pour les modes solo et compétitif
			if (player === this.player1) {
				this.livesPlayer1 -= 1;
				this.livesTextPlayer1.setText("Vies P1: " + this.livesPlayer1);
			} else if (player === this.player2) {
				this.livesPlayer2 -= 1;
				this.livesTextPlayer2.setText("Vies P2: " + this.livesPlayer2);
			}

			// Vérification de la fin de partie pour les modes solo et compétitif
			if (
				(this.gameMode === "solo" && this.livesPlayer1 <= 0) ||
				(this.gameMode === "compet" &&
					(this.livesPlayer1 <= 0 || this.livesPlayer2 <= 0))
			) {
				this.endGame();
			}
		}
	}

	endGame() {
		// Arrêt du jeu et affichage de l'écran de fin avec les scores appropriés
		this.physics.pause();
		if (this.bgMusic && typeof this.bgMusic.stop === "function") {
			this.bgMusic.stop();
		}
		let data = {
			mode: this.gameMode,
		};

		let winner;
		if (this.gameMode === "compet") {
			if (this.livesPlayer1 <= 0 && this.livesPlayer2 > 0) {
				winner = "Joueur 2";
			} else if (this.livesPlayer2 <= 0 && this.livesPlayer1 > 0) {
				winner = "Joueur 1";
			} else {
				// En cas d'égalité de vies, le score le plus élevé l'emporte
				if (this.scorePlayer1 > this.scorePlayer2) {
					winner = "Joueur 1";
				} else if (this.scorePlayer2 > this.scorePlayer1) {
					winner = "Joueur 2";
				} else {
					winner = "Égalité";
				}
			}
		} else if (this.gameMode === "coop") {
			data.globalScore = this.globalScore;
		} else {
			data.scorePlayer1 = this.scorePlayer1;
		}
		console.log("Winner:", winner);

		this.scene.start("EndScene", {
			gameMode: this.gameMode,
			scorePlayer1: this.scorePlayer1,
			scorePlayer2: this.scorePlayer2,
			globalScore: this.globalScore,
			livesPlayer1: this.livesPlayer1,
			livesPlayer2: this.livesPlayer2,
			winner: winner,
		});
	}
}

class EndScene extends Phaser.Scene {
	constructor() {
		super({ key: "EndScene" });
	}

	init(data) {
		this.gameMode = data.gameMode;
		this.scorePlayer1 = data.scorePlayer1;
		this.scorePlayer2 = data.scorePlayer2;
		this.livesPlayer1 = data.livesPlayer1;
		this.livesPlayer2 = data.livesPlayer2;
		this.globalScore = data.globalScore;
		this.winner = data.winner;
	}

	create() {
		const centerX = this.cameras.main.centerX;
		const centerY = this.cameras.main.centerY;

		console.log("Game Mode in EndScene:", this.gameMode);
		console.log("Winner in EndScene:", this.winner);

		// Affiche le message de fin et le score en fonction du mode de jeu
		if (this.gameMode === "compet") {
			let message = `Fin de la partie. ${this.winner} gagne !`;
			if (this.winner === "Égalité") {
				message = "Fin de la partie. Égalité !";
			}
			this.add
				.text(centerX, centerY, message, {
					fontFamily: "Retro",
					fontSize: "32px",
					fill: "#FFF",
				})
				.setOrigin(0.5);

			this.add
				.text(
					centerX,
					centerY + 45,
					`Score J1: ${this.scorePlayer1} - Score J2: ${this.scorePlayer2}`,
					{
						fontFamily: "Retro",
						fontSize: "24px",
						fill: "#FFF",
					}
				)
				.setOrigin(0.5);
			this.add
				.text(
					centerX,
					centerY + 75,
					`Vies J1: ${this.livesPlayer1} - Vies J2: ${this.livesPlayer2}`,
					{
						fontFamily: "Retro",
						fontSize: "24px",
						fill: "#FFF",
					}
				)
				.setOrigin(0.5);
		} else if (this.gameMode === "coop") {
			// En mode coop, affiche le score global
			this.add
				.text(
					centerX,
					centerY,
					`Fin de la partie. Score Global: ${this.globalScore}`,
					{ fontFamily: "Retro", fontSize: "32px", fill: "#FFF" }
				)
				.setOrigin(0.5);
		} else {
			// Mode solo
			this.add
				.text(
					centerX,
					centerY,
					`Fin de la partie. Score: ${this.scorePlayer1}`,
					{
						fontFamily: "Retro",
						fontSize: "32px",
						fill: "#FFF",
					}
				)
				.setOrigin(0.5);
		}

		// Ajoute un texte cliquable pour redémarrer le jeu
		let restartText = this.add
			.text(centerX, centerY + 110, "Cliquez pour rejouer", {
				fontSize: "24px",
				fill: "#FFF",
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		restartText.on("pointerdown", () => {
			this.sound.playAudioSprite("sfx", "numkey");
			this.scene.start("BootScene");
		});
	}
}

const config = {
	type: Phaser.AUTO,
	parent: "phaser-game",
	width: 940,
	height: 700,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0 },
			debug: false,
		},
	},
	scene: [BootScene, MainScene, EndScene],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	autoRound: false,
};

new Phaser.Game(config);
