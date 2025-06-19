const { v4: uuid } = require("uuid");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("nuevo socket conectado:", socket.id);

    socket.on('joinPaciente', (codpaci) => {
      socket.join(`paciente_${codpaci}`);
      console.log(`Socket ${socket.id} se unió a la sala paciente_${codpaci}`);
    });

    socket.on("disconnect", () => {
      console.log(socket.id, "disconnected");
    });
  });
};
