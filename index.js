import HBInit from 'haxball.js';
import fs from 'fs';

const DB_FILE = './stats.json';
let db = { players: {} };

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    db = { players: {} };
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getPlayerStats(auth) {
  if (!db.players[auth]) {
    db.players[auth] = {
      name: "Desconocido",
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      elo: 1000
    };
  }
  return db.players[auth];
}

async function startServer() {
  try {
    const room = await HBInit({
      roomName: "🐍🐍🐍COBRA x3🐍🐍🐍 / ELO rank",
      maxPlayers: 20,
      public: true,
      noPlayer: true,
      token: "thr1.AAAAAGrRAxTWuEQg-Fc5TA.FvxW7PgSzCw",
      geo: { code: "ar", lat: -31.6333, lon: -60.7 }, // Configurado específicamente para Argentina (Santa Fe)
    });

    console.log("==================================================");
    console.log(" ¡SERVIDOR DE LA COBRA ONLINE EN ARGENTINA!");
    console.log(" Mantén esta pantalla abierta para que la sala funcione.");
    console.log("==================================================");

    let redStreak = 0;
    let blueStreak = 0;

    room.onPlayerJoin = (player) => {
      let pStats = getPlayerStats(player.auth);
      pStats.name = player.name;
      saveDB();
      room.sendAnnouncement(`¡Bienvenido a la COBRA x3 ${player.name}! 🐍 Escribe !help para ver los comandos.`, player.id, 0x00FF00);
    };

    room.onTeamGoal = (team) => {
      if (team === 1) {
        redStreak++;
        blueStreak = 0;
        room.sendAnnouncement(`🚨 ¡¡GOOOOL DEL EQUIPO ROJO!! Se vengan con todo a morder. (Racha roja: ${redStreak} invictos)`, null, 0xFF4444);
      } else if (team === 2) {
        blueStreak++;
        redStreak = 0;
        room.sendAnnouncement(`🚨 ¡¡GOOOOL DEL EQUIPO AZUL!! Metieron daga letal. (Racha azul: ${blueStreak} invictos)`, null, 0x4444FF);
      }
    };

    room.onPlayerChat = (player, message) => {
      if (!message.startsWith('!')) return true;

      const args = message.slice(1).trim().split(' ');
      const command = args[0].toLowerCase();

      if (command === 'help') {
        room.sendAnnouncement(`Comandos: !stats [nombre], !top, !posicion`, player.id, 0x00FFFF);
        return false;
      }

      if (command === 'stats') {
        let targetName = args.slice(1).join(' ').trim();
        let targetStats = null;
        let targetDisplayName = "";

        if (targetName === "") {
          targetStats = getPlayerStats(player.auth);
          targetDisplayName = player.name;
        } else {
          let foundAuth = Object.keys(db.players).find(auth => 
            db.players[auth].name.toLowerCase().includes(targetName.toLowerCase())
          );
          if (foundAuth) {
            targetStats = db.players[foundAuth];
            targetDisplayName = targetStats.name;
          }
        }

        if (targetStats) {
          room.sendAnnouncement(`📊 Stats de [${targetDisplayName}]: Goles: ${targetStats.goals} | Asistencias: ${targetStats.assists} | Partidos: ${targetStats.matchesPlayed} | ELO: ${targetStats.elo}`, player.id, 0xFFFF00);
        } else {
          room.sendAnnouncement(`⚠️ No se encontró al jugador "${targetName}".`, player.id, 0xFF0000);
        }
        return false;
      }

      if (command === 'top') {
        let sorted = Object.values(db.players).sort((a, b) => b.elo - a.elo).slice(0, 5);
        let msg = "🏆 TOP 5 COBRA X3 (ELO):\n";
        sorted.forEach((p, idx) => {
          msg += `${idx + 1}. ${p.name} - ${p.elo} pts (${p.goals} Goles)\n`;
        });
        room.sendAnnouncement(msg, player.id, 0xFFD700);
        return false;
      }

      if (command === 'posicion') {
        let sorted = Object.values(db.players).sort((a, b) => b.elo - a.elo);
        let pos = sorted.findIndex(p => p.name === player.name) + 1;
        room.sendAnnouncement(`📌 ${player.name}, estás en el puesto #${pos} de la COBRA.`, player.id, 0x00FFCC);
        return false;
      }

      return true;
    };

    // Mantiene el proceso vivo indefinidamente de forma elegante
    await new Promise(() => {});

  } catch (err) {
    console.error("Error al iniciar la sala:", err);
  }
}

startServer();