$().ready(() => {
	var electro = new Electro({ emulator: true });
	electro.on("connect", function () {
		$("#simulador").removeClass("desconectado");
		$("#estado").text("Conectado");

		// Sensores
		electro._sensors.forEach(sensor => {
			var $x = $("<td />").appendTo($("<tr><td><strong>" + sensor + "</strong></td></tr>").appendTo("#sensors tbody"));
			function time(date) {
				function dd(n) { return (n < 10 ? "0" : "") + n; }
				return dd(date.getHours()) + ":" + dd(date.getMinutes()) + ":" + dd(date.getSeconds());
			}
			electro.on(sensor, (val) => {
				$x.html(val instanceof Date ? time(val) : JSON.stringify(val));
			});
		});

		// Parámetros
		electro._parameters.forEach(param => {
			var $row = $("<tr><td><strong>" + param + "</strong></td></tr>").appendTo("#parameters tbody");
			var $c = $("<td />").appendTo($row);


			if (param == "tamborRevoluciones") {
				let $input = $("<input type='number' name='" + param + "' /> ").appendTo($c);
				$input.val(electro[param]);
				$input.on("change", function () {
					electro[param] = $input.val();
				});
				electro.on(param, val => {
					$input.val(val);
				});
			} else {
				let $input = $("<input type='checkbox' name='" + param + "' /> ").appendTo($c);
				//$input.prop("checked", electro[param]);
				$input.on("change", function () {
					electro[param] = $input.prop('checked');
				});
				electro.on(param, val => {
					$input.prop("checked", val);
				});
			}
		});

		// Puerta
		$("#puerta").click(function () {
			if (electro.puertaAbierta) {
				electro.puertaAbierta = false;
			} else {
				if (!electro.puertaBloqueada) electro.puertaAbierta = true;
			}
		});
		electro.on("puertaAbierta", value => {
			$("#puerta").toggleClass("abierta", value);
			tiposRopa.forEach(t => $("#r" + t).prop("disabled", !electro.puertaAbierta));
			$("#rVaciar").prop("disabled", !electro.puertaAbierta);
		});

		// Detergente
		$("#detergente").click(() => { electro.nivelDetergente = Math.min(electro.nivelDetergente + 5, 100) });

		// Suavizante
		$("#suavizante").click(() => { electro.nivelSuavizante = Math.min(electro.nivelSuavizante + 5, 100) });

		var tiposRopa = ["Blanco", "Color", "Oscuro"];

		function nivelRopa() { // actualiza los niveles de ropa
			var n = 0;
			tiposRopa.forEach(t => {
				document.getElementById("n" + t).style.bottom = n + "%";
				var x = Math.round(electro["sensor" + t] * electro.peso / 5000);
				document.getElementById("n" + t).style.height = x + "%";
				n += x;
			});
		}

		tiposRopa.forEach(t => {
			$("#r" + t).click(() => {
				const n = 500;
				var peso = electro.peso;
				var p = {};
				tiposRopa.forEach(t => { p[t] = peso * electro["sensor" + t] / 100; });
				peso += n;
				if (peso > 5000 || peso < 0) return;
				p[t] += n;
				if (p[t] < 0) return;
				electro.peso = peso;
				tiposRopa.forEach(t => { electro["sensor" + t] = peso ? Math.round(p[t] / peso * 100) : 0; });
			});
			electro.on("sensor" + t, nivelRopa);
		});
		$("#rVaciar").click(() => {
			electro.peso = 0;
			tiposRopa.forEach(t => electro["sensor" + t] = 0);
			electro.humedad = 0;
		});

		electro.on("tamborRevoluciones", rev => {
			document.getElementById("ropa").classList.toggle("girar", rev != 0);
			document.getElementById("ropa").classList.toggle("inv", rev < 0);
		});
		electro.on("tamborSentido", dir => {
		});

		// Agua
		electro.on("nivelAgua", agua => {
			document.getElementById("agua").style.height = agua + "%";
		});

		$("#usuario").click(() => { electro.presencia = !electro.presencia; });
		electro.on("presencia", (val) => { $("#usuario").toggleClass("presencia", val); });

		$("#filtro").click(() => { electro.filtroObstruido = !electro.filtroObstruido; });
		electro.on("filtroObstruido", val => { $("#filtro").toggleClass("obstruido", val); });

		// Error o desconexión
		function stop() {
			$("#simulador").addClass("desconectado");
			$("#estado").text("Desconectado");
		}
		electro.on("error", stop);
		electro.on("disconnect", stop);
	});
});