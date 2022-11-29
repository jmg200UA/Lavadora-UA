const Electro = require("./electro.js").Electro;

class Lavadora extends Electro {
	constructor(httpServer, debug) {
		var temp = 22; // temperatura por defecto

		// Inicializar las propiedades del lavadora
		super({ // sensores
			reloj: null,
			puertaAbierta: false,
			filtroObstruido: false,
			temperaturaAgua: temp,
			temperaturaAire: temp,
			nivelAgua: 0,
			nivelDetergente: 50,
			nivelSuavizante: 50,
			peso: 0,
			humedad: 0,
			sensorBlanco: 0,
			sensorColor: 0,
			sensorOscuro: 0,
			presencia: false,
			consumo: 0
		}, { // actuadores
			puertaBloqueada: false,
			tomaAgua: false,
			tomaDetergente: false,
			tomaSuavizante: false,
			desague: false,
			tamborRevoluciones: 0,
			resistenciaAgua: false,
			resistenciaAire: false,
			flujoAire: false,
		}, httpServer, debug);

		this.on("puertaAbierta", val => {
			if (val) { // si se abre la puerta... 
				if (this.nivelAgua) this.nivelAgua = 0; // ... si hay agua, se sale
				if (this.temperaturaAgua > temp) this.temperaturaAgua = temp; // ... se enfría el agua
				if (this.temperaturaAire > temp) this.temperaturaAire = temp; // ... se enfria el aire
				if (this.humedad) this.humedad = 0; // ... se seca la ropa
			}
		});

		this.on("tomaAgua", val => {
			if (val) this.humedad = 100; // Si se echa agua se consigue humedad
		});

		setInterval(() => { // cada segundo
			this.reloj = new Date(); // actualizar la hora

			// Consumo
			var consumo = 0;
			if (this.tamborRevoluciones) consumo += 5;
			if (this.resistenciaAgua) consumo += 40;
			if (this.resistenciaAire) consumo += 20;
			if (this.flujoAire) consumo += 2;
			this.consumo += consumo;

			// Agua
			if (this.tomaAgua && !this.puertaAbierta && this.nivelAgua < 100) this.nivelAgua += 5;
			if (this.desague && this.nivelAgua) this.nivelAgua -= 5;

			// Detergente
			if (this.tomaDetergente && this.nivelDetergente) this.nivelDetergente--;

			// Suavizante
			if (this.tomaSuavizante && this.nivelSuavizante) this.nivelSuavizante--;

			if (!this.puertaAbierta) {
				// Temperatura Agua
				if (this.resistenciaAgua && this.nivelAgua && this.temperaturaAgua < 100) this.temperaturaAgua++;
				if (!this.resistenciaAgua && this.nivelAgua && this.temperaturaAgua > temp) this.temperaturaAgua--;
				// Temperatura Aire
				if (this.resistenciaAire && this.temperaturaAire < 100) this.temperaturaAire++;
				if (!this.resistenciaAire && this.temperaturaAire > temp) this.temperaturaAire--;
				// Humedad
				if (this.flujoAire && this.humedad) this.humedad -= this.temperaturaAire > temp ? 2 : 1;
			}
		}, 1000);
	}
}

exports.Lavadora = Lavadora;