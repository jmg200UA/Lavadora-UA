var electro = new Electro();
var nummodo=0;
var secacion=0;
var pausasion=0;
var estalavando=0;

// Llena un deposito hasta un nivel usando un sensor de nivel y una valvula que abre el flujo
function llenar(sensor, valvula, nivel, callback) {
    console.log("  - Llenar depósito.", sensor, "->", nivel);
    electro.on(sensor, function comprobarNivel(nivelActual) { // monitorizar el sensor
        if (nivelActual >= nivel) { // se ha alzanzado el nivel
            electro.off(sensor, comprobarNivel); // dejar de monitorizar
            console.log("    - Cerrar válvula:", valvula);
            electro[valvula] = false; // cerrar la válvula
            callback();
        }
    });
    console.log("    - Abrir válvula:", valvula);
    electro[valvula] = true; // abro la topa
}
// Vaciar un deposito hasta un nivel usando un sensor de nivel y una válvula que abre el flujo
function vaciar(sensor, valvula, nivel, callback) {
    console.log("  - Vaciar depósito.", sensor, "->", nivel);
    electro.on(sensor, function comprobarNivel(nivelActual) { // monitorizar el sensor
        if (nivelActual <= nivel) { // se ha alzanzado el nivel
            electro.off(sensor, comprobarNivel); // dejar de monitorizar
            console.log("    - Cerrar válvula:", valvula);
            electro[valvula] = false; // cerrar la válvula
            callback();
        }
    });
    console.log("    - Abrir válvula:", valvula);
    electro[valvula] = true; // abro la topa
}

// Establece una temperatura a un valor, encendiendo y apagando una resistencia durante un tiempo (ms)
function termostato(sensor, resistencia, temp, duracion, callback) {
function comprobarTemp(tempAct) {
if (tempAct < temp) electro[resistencia] = true;
if (tempAct > temp) electro[resistencia] = false;
}
electro.on(sensor, comprobarTemp);
comprobarTemp(electro[sensor]); // llamar la primera vez por si tiene que encender
setTimeout(function () {
electro[resistencia] = false;
electro.off(sensor, comprobarTemp);
callback();
}, duracion);
}

// Realiza un lavado
function lavar(callback) {
    // Obtener parámetros del lavado
    var
        detergente = document.getElementById("nivelDetergente").value,
        suavizante = document.getElementById("nivelSuavizante").value,
        nivelAgua = document.getElementById("nivelAgua").value,
        temperaturaLavado = document.getElementById("temperaturaAgua").value,
        revolucionesLavado = document.getElementById("revolucionesLavado").value,
        tiempoLavado = document.getElementById("tiempoLavado").value * 1000,
        revolucionesCentrifugado = document.getElementById("revolucionesCentrifugado").value,
        tiempoCentrifugado = document.getElementById("tiempoCentrifugado").value * 1000;


    pausasion=1;
    estalavando=1;
    principales();

    let html="";
    // Puerta abierta
    if (electro.puertaAbierta) {
        html='';
        html += '<h2>La puerta está abierta, cierrala antes de empezar</h2>';
        document.getElementById("info").innerHTML=html;

        //alert("Puerta abierta!!!!");
        callback();
        return;
    }

    // Hay ropa?
    if (!electro.peso) {
        html='';
        html += '<h2>No hay ropa en la lavadora, mete ropa para empezar</h2>';
        document.getElementById("info").innerHTML=html;
        //alert("Parece que no hay ropa en la lavadora.");
        callback();
        return;
    }
    html ='';
    html += '<h2><strong>Iniciar lavado</strong></h2>';
    html += '<h2>Puerta bloqueada</h2>';
    html += '<h2>Llenar de agua para el lavado</h2>';
    document.getElementById("info").innerHTML=html;
    console.log("Iniciar lavado");

    electro.puertaBloqueada = true; // Bloquear puerta durante el lavado
    console.log("Puerta bloqueada");

    // Llenar de agua el tambor (para lavado)
    console.log("Llenar de agua (para lavado)...")
    llenar("nivelAgua", "tomaAgua", nivelAgua, function () {
        // Detergente
        console.log("Poner detergente...");
        vaciar("nivelDetergente", "tomaDetergente", electro.nivelDetergente - detergente, function () {
            // Lavado
            html="";
            html += '<h2>Lavar</h2>';
            document.getElementById("info").innerHTML=html;
            console.log("Lavar...")
            electro.tamborRevoluciones = revolucionesLavado;
            termostato("temperaturaAgua", "resistenciaAgua", temperaturaLavado, tiempoLavado, function () {
                // Vaciar agua
                html="";
                html += '<h2>Vaciar tambor de agua</h2>';
                document.getElementById("info").innerHTML=html;
                console.log("Vaciar tambor de agua...");
                vaciar("nivelAgua", "desague", 0, function () {
                    // Llenar de agua para suavizante
                    console.log("Llenar de agua (para suavizante)...")
                    llenar("nivelAgua", "tomaAgua", nivelAgua, function () {
                        // Suavizante
                        html="";
                        html += '<h2>Poner suavizante</h2>';
                        document.getElementById("info").innerHTML=html;
                        vaciar("nivelSuavizante", "tomaSuavizante", electro.nivelSuavizante - suavizante, function () {
                            // Vaciar agua
                            html="";
                            html += '<h2>Vaciar tambor de agua</h2>';
                            document.getElementById("info").innerHTML=html;
                            console.log("Vaciar tambor de agua...");
                            vaciar("nivelAgua", "desague", 0, function () {
                                // Centrifugar
                                html="";
                                html += '<h2>Centrifugar</h2>';
                                document.getElementById("info").innerHTML=html;
                                console.log("Centrifugar...")
                                electro.tamborRevoluciones = revolucionesCentrifugado;
                                setTimeout(function () {
                                    html="";
                                    html += '<h2>Fin del lavado</h2>';
                                    document.getElementById("info").innerHTML=html;
                                    console.log("Fin del lavado!!!");
                                    electro.tamborRevoluciones = 0; // parar motor
                                    electro.puertaBloqueada = false; // desbloquear puerta
                                    secacion=1;
                                    estalavando=0;
                                    callback();
                                }, tiempoCentrifugado);
                            });
                        });
                    });
                });
            });
        });
    });
}

electro.on("connect", function () { // Esparar a que la librería se conecte con la lavadora
    console.log("Ya estoy conectado con la lavadora!!")
    console.log("Con este hay " + electro.clientes + " clientes conectados");

    // Bloqueo de puerta
    var bloqueo = document.getElementById("bloqueo");
    bloqueo.addEventListener("click", function () {
        electro.puertaBloqueada = !electro.puertaBloqueada;
    });
    electro.on("puertaBloqueada", function (bloqueado) {
        bloqueo.innerHTML = bloqueado ? "<img src='img/padlock.png' alt='Puerta bloqueada' title='Puerta bloqueada'><button id='luzroja'></button>" : "<img src='img/padlock.png' alt='Puerta no bloqueada' title='Puerta no bloqueada'><button id='luz'></button>";
    });

    // Lavar
    var botonLavar = document.getElementById("lavar");
    botonLavar.addEventListener("click", function () {
        botonLavar.disabled = true;
        lavar(function () {
            botonLavar.disabled = false;
        });
    });
});


function tiempo(){
    if(nummodo==0){
        myDate = new Date();
        hours = myDate.getHours();
        minutes = myDate.getMinutes();
        seconds = myDate.getSeconds();
        if (hours < 10) hours = 0 + hours;
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        document.getElementById("tiempo").innerHTML = hours+ ":" +minutes+ ":" +seconds;
        window.onload = function() {
            setInterval(tiempo, 1000);
        }
    }
    
}

function programas(int){
    var revlav=document.getElementById("revolucionesLavado").value;
        var tlav=document.getElementById("tiempoLavado").value;

        var revcen=document.getElementById("revolucionesCentrifugado").value;
        var tcen=document.getElementById("tiempoCentrifugado").value;

        var det=document.getElementById("nivelDetergente").value;
        var suav=document.getElementById("nivelSuavizante").value;
        var agua=document.getElementById("nivelAgua").value;
        var temp=document.getElementById("temperaturaAgua").value;
    //hora home
    if(int==0  && estalavando==0 && secacion==0){
        nummodo=0;
        tiempo();
        html = "";
        html = "<div id='parametros2'><div><label><img src='img/peso.png' alt='Peso' title='Peso'><p id='pesasion'>" + electro.peso + "</p></label></div><div><label><img src='img/flash.png' alt='Consumo' title='Consumo'><p id='consumision'>" + electro.consumo + "</p></label></div><div><label><img src='img/humedad.png' alt='Humedad' title='Humedad'><p id='humedasion'>" + electro.humedad + "</p></label></div></div>";
        document.getElementById("info").innerHTML=html;
    }
    //lavado rapido
    if(int==1 && estalavando==0 && secacion==0){
        nummodo=1;
        //lavado
        document.getElementById("revolucionesLavado").value=1200;
        document.getElementById("tiempoLavado").value=5;
        //centrifugado
        document.getElementById("revolucionesCentrifugado").value=1200;
        document.getElementById("tiempoCentrifugado").value=5;
        //parametros
        document.getElementById("nivelDetergente").value=30;
        document.getElementById("nivelSuavizante").value=30;
        document.getElementById("nivelAgua").value=90;
        document.getElementById("temperaturaAgua").value=50;

        let html="";
        html="<div id='modo1'><h2>Modo de lavado Rápido</h2></div>"
        document.getElementById("tiempo").innerHTML=html;
        html= "";
        html = "<div id='modosflex'><ul><li><strong>Rev. de Lavado:</strong> 1200</li><li><strong>Tiempo de Lavado:</strong> 5</li><li><strong>Rev. de Centrifugado:</strong> 1200</li><li><strong>Tiempo de Centrifugado:</strong> 5</li><li><strong>Detergente:</strong> 30</li><li><strong>Suavizante:</strong> 30</li><li><strong>Nivel de Agua:</strong> 90</li><li><strong>Temperatura:</strong> 50</li></ul><button class='atras2' id='atras2' title='Atrás' alt='Atrás' type='button' name='cuarto' onclick='programas(0);'>Atrás</button></div>";
        document.getElementById("info").innerHTML=html;
        valores();
    }
    //lavado estandar
    if(int==2  && estalavando==0 && secacion==0){
        nummodo=2;
        //lavado
        document.getElementById("revolucionesLavado").value=850;
        document.getElementById("tiempoLavado").value=15;
        //centrifugado
        document.getElementById("revolucionesCentrifugado").value=850;
        document.getElementById("tiempoCentrifugado").value=15;
        //parametros
        document.getElementById("nivelDetergente").value=20;
        document.getElementById("nivelSuavizante").value=20;
        document.getElementById("nivelAgua").value=80;
        document.getElementById("temperaturaAgua").value=40;

        html="<div id='modo1'><h2>Modo de lavado Estándar</h2></div>"
        document.getElementById("tiempo").innerHTML=html;
        html = "";
        html = "<div id='modosflex'><ul><li><strong>Rev. de Lavado:</strong> 850</li><li><strong>Tiempo de Lavado:</strong> 15</li><li><strong>Rev. de Centrifugado:</strong> 850</li><li><strong>Tiempo de Centrifugado:</strong> 15</li><li><strong>Detergente:</strong> 20</li><li><strong>Suavizante:</strong> 20</li><li><strong>Nivel de Agua:</strong> 80</li><li><strong>Temperatura:</strong> 40</li></ul><button class='atras2' id='atras2' title='Atrás' alt='Atrás' type='button' name='cuarto' onclick='programas(0);'>Atrás</button></div>";
        document.getElementById("info").innerHTML=html;
        valores();
    }
    //lavado a fondo
    if(int==3  && estalavando==0 && secacion==0){
        nummodo=3;
        //lavado
        document.getElementById("revolucionesLavado").value=750;
        document.getElementById("tiempoLavado").value=30;
        //centrifugado
        document.getElementById("revolucionesCentrifugado").value=750;
        document.getElementById("tiempoCentrifugado").value=30;
        //parametros
        document.getElementById("nivelDetergente").value=20;
        document.getElementById("nivelSuavizante").value=20;
        document.getElementById("nivelAgua").value=110;
        document.getElementById("temperaturaAgua").value=50;

        html="<div id='modo1'><h2>Modo de lavado a Fondo</h2></div>"
        document.getElementById("tiempo").innerHTML=html;
        html = "";
        html = "<div id='modosflex'><ul><li><strong>Rev. de Lavado:</strong> 750</li><li><strong>Tiempo de Lavado:</strong> 30</li><li><strong>Rev. de Centrifugado:</strong> 750</li><li><strong>Tiempo de Centrifugado:</strong> 30</li><li><strong>Detergente:</strong> 20</li><li><strong>Suavizante:</strong> 20</li><li><strong>Nivel de Agua:</strong> 110</li><li><strong>Temperatura:</strong> 50</li></ul><button class='atras2' id='atras2' title='Atrás' alt='Atrás' type='button' name='cuarto' onclick='programas(0);'>Atrás</button></div>";
        document.getElementById("info").innerHTML=html;
        valores();
    }

    if(int==4  && estalavando==0 && secacion==0){
        if(document.getElementById("pantalla").innerHTML!=""){
        nummodo=4;
        }
        else{
            nummodo=5;
        }

        if(nummodo==4){
            //lavado
            document.getElementById("revolucionesLavado").value="";
            document.getElementById("tiempoLavado").value="";
            //centrifugado
            document.getElementById("revolucionesCentrifugado").value="";
            document.getElementById("tiempoCentrifugado").value="";
            //parametros
            var det=document.getElementById("nivelDetergente").value="";
            var suav=document.getElementById("nivelSuavizante").value="";
            var agua=document.getElementById("nivelAgua").value="";
            var temp=document.getElementById("temperaturaAgua").value="";

            html="";
            document.getElementById("pantalla").innerHTML=html;

            document.getElementById('principal').style.pointerEvents = 'none';

            document.getElementById("valordet").innerHTML="";
            document.getElementById("valorsuav").innerHTML="";
            document.getElementById("valoragua").innerHTML="";
            document.getElementById("valortemp").innerHTML="";

            document.getElementById("valorrevlav").innerHTML="<br>";
            document.getElementById("valortiemplav").innerHTML="";
            document.getElementById("valorrevcent").innerHTML="<br>";
            document.getElementById("valortiempcent").innerHTML="";
            // To re-enable:
            document.getElementById('encendido').style.pointerEvents = 'auto';
        }

        else if(nummodo==5){
            location.reload();
        }
    }
    /*ACABADO LAVADORA*/
    if(int==5){
        electro.tamborRevoluciones = 0; // parar motor
        electro.puertaBloqueada = false; // desbloquear puerta
    }
    /*SONIDO INICIO*/
    if(int==6){
        let boton = document.querySelector(".reproductor");
        let audioEtiqueta = document.querySelector("audio");

        boton.addEventListener("click", () => {
          audioEtiqueta.setAttribute("src", "sonido/sonido_agradable.mp3");
          audioEtiqueta.play();
          console.log(`Reproduciendo: ${audioEtiqueta.src}`);
        });
    }
    /*OPCIONES*/
    if(int==7  && estalavando==0 && secacion==0){
        nummodo=7;
        /*<div id="bloqueo"></div>*/

        html="<div id='opc'><h2>Opciones</h2></div>"
        document.getElementById("tiempo").innerHTML=html;

        html = "";
        html = "<div id='parametros2'><button class='botonm'  type='button' name='abrir' onclick='abrir();''><img src='img/abrirpuerta.png' title='Abrir/cerrar puerta' alt='Abrir cerrar puerta'></button><button class='botonm'  type='button' name='manual' onclick='programas(8);'><img src='img/manual.png' title='Manual' alt='Manual'></button><button class='botonm'  type='button' name='modos' onclick='programas(9);'><img src='img/modos.png' title='Modos' alt='Modos'></button></div><button class='atras' id='atras' title='Atrás' alt='Atrás' type='button' name='cuarto' onclick='programas(0);'>Atrás</button>";
        document.getElementById("info").innerHTML=html;
    }

    if(int==9  && estalavando==0 && secacion==0){
        nummodo=9;
        /*<div id="bloqueo"></div>*/

        html="<div id='opc'><h2>Modos de lavado</h2></div>"
        document.getElementById("tiempo").innerHTML=html;

        html = "";
        html = '<div><div id="parametros2"><button class="botonm"  type="button" name="primero" onclick="programas(1);"><img src="img/lavadorarapido.png" title="Lavado rápido" alt="Lavado rápido"></button><button class="botonm"  type="button" name="segundo" onclick="programas(2);"><img src="img/lavadoraestandar.png" title="Lavado estándar" alt="Lavado estándar"></button><button class="botonm"  type="button" name="tercero" onclick="programas(3);"><img src="img/lavadoraafondo.png" title="Lavado a fondo" alt="Lavado a fondo"></button></div><button class="atras" id="atras" title="Atrás" alt="Atrás" type="button" name="cuarto" onclick="programas(7);">Atrás</button></div>';
        document.getElementById("info").innerHTML=html; 
    }
    if(int==10  && estalavando==0 && secacion==0){
        nummodo=10;
        html="<div id='opc'><h2>Manual de usuario</h2></div>"
        document.getElementById("tiempo").innerHTML=html;

        html = "";
        html = '<video width=320  height=240 controls poster="vistaprevia.jpg" id="manualvideo"><source src="img/Manual.mp4" type="video/mp4"></video>';
        document.getElementById("info").innerHTML=html; 
    }
    

}

/*MENSAJE MODAL*/

function mensajeModal(html){
    let div= document.createElement('div');

    //div.id='capa-fondo';
    div.setAttribute('id','capa-fondo');
    div.innerHTML= html;

    document.querySelector('body').appendChild(div);
}

function cerrarMensajeModal(){
    document.querySelector('#capa-fondo').remove();
}

function valores(){
    var revlav=document.getElementById("revolucionesLavado").value;
    var tlav=document.getElementById("tiempoLavado").value;

    var revcen=document.getElementById("revolucionesCentrifugado").value;
    var tcen=document.getElementById("tiempoCentrifugado").value;

    var det=document.getElementById("nivelDetergente").value;
    var suav=document.getElementById("nivelSuavizante").value;
    var agua=document.getElementById("nivelAgua").value;
    var temp=document.getElementById("temperaturaAgua").value;

    document.getElementById("valordet").innerHTML=det;
    document.getElementById("valorsuav").innerHTML=suav;
    document.getElementById("valoragua").innerHTML=agua;
    document.getElementById("valortemp").innerHTML=temp;

    document.getElementById("valorrevlav").innerHTML=revlav;
    document.getElementById("valortiemplav").innerHTML=tlav;
    document.getElementById("valorrevcent").innerHTML=revcen;
    document.getElementById("valortiempcent").innerHTML=tcen;
}

function valores2(){
    var peso=electro.peso;
    var consumo=electro.consumo;
    var humedad=electro.humedad;

    document.getElementById("pesasion").innerHTML=peso;
    document.getElementById("consumision").innerHTML=consumo;
    document.getElementById("humedasion").innerHTML=humedad;
}

function abrir(){
    electro.on("connect", function () {
        //Abrir Cerrar Puerta
        var puertaab = document.getElementById("abrir");
        puertaab.addEventListener("click", function () {
            electro.puertaAbierta = !electro.puertaAbierta;
        });
        electro.on("puertaAbierta", function (abierta) {
            puertaab.innerHTML = abierta ? "<p>puerta abierta</p>" : "<p>puerta cerrada</p>";
        });
    });
}

function secado(){
    // Obtener parámetros del secado
    var
        temperaturaAire = document.getElementById("nivelDetergente").value,
        resistenciaAire = document.getElementById("nivelSuavizante").value,
        nivelAgua = document.getElementById("nivelAgua").value,
        revolucionesSecado = document.getElementById("revolucionesCentrifugado").value,
        tiempoSecado = document.getElementById("tiempoCentrifugado").value * 1000;
    // cambiar los ids para cuando esten los inputs
    estalavando=1;
    let html="";
    // Puerta abierta
    if (electro.puertaAbierta) {
        html='';
        html += '<h2>La puerta está abierta, cierrala antes de empezar</h2>';
        document.getElementById("info").innerHTML=html;

        //alert("Puerta abierta!!!!");
        callback();
        return;
    }

    // Hay ropa?
    if (!electro.peso) {
        html='';
        html += '<h2>No hay ropa en la lavadora, mete ropa para empezar</h2>';
        document.getElementById("info").innerHTML=html;
        //alert("Parece que no hay ropa en la lavadora.");
        callback();
        return;
    }
    html ='';
    html += '<h2><strong>Iniciar secado</strong></h2>';
    html += '<h2>Puerta bloqueada</h2>';
    document.getElementById("info").innerHTML=html;
    console.log("Iniciar secado");

    electro.puertaBloqueada = true; // Bloquear puerta durante el lavado
    console.log("Puerta bloqueada");

    electro.tamborRevoluciones = revolucionesSecado;
            termostato("temperaturaAire", "resistenciaAire", temperaturaAire, tiempoSecado, function () {
                    electro.tamborRevoluciones = revolucionesCentrifugado;
                    setTimeout(function () {
                        console.log("Fin del lavado!!!");
                        html ='';
                        html += '<h2><strong>Fin del secado</strong></h2>';
                        document.getElementById("info").innerHTML=html;
                        estalavando=0;
                        electro.tamborRevoluciones = 0; // parar motor
                        electro.puertaBloqueada = false; // desbloquear puerta
                        callback();
                    }, tiempoCentrifugado);
            });

}

function lavados(){
    var blanco=electro.sensorBlanco;
        var color=electro.sensorColor;
        var negra=electro.sensorOscuro;
        var numcolor=0;
    //lavado rapido
    if(blanco==0 && negra==0 && color==0) numcolor=0;
    else if(blanco>0 && color==0 && negra==0){
        numcolor=1;
    }
    else if(negra>0 && color==0 && blanco==0){
        numcolor=2;
    }
    else if(blanco>0 && negra>0 || color>0) numcolor=3;


    if(numcolor==0){
        let html="";
        html="";
        document.getElementById("pruebiscula").innerHTML=html;
        html="<h4 id='ropiscula'>Ropa</h4><button id='sinropa' alt='Sin ropa' title='Sin ropa'><img src='img/sinropa.png' alt='Sinropa' title='Sinropa'></button>"
        document.getElementById("modosdecolor").innerHTML=html;
    }

    if(numcolor==1){
        let html="";
        html="Modo recomendado : Lavado rápido";
        document.getElementById("pruebiscula").innerHTML=html;
        html="";
        html="<h4 id='ropiscula'>Ropa</h4><button id='ropablanca' alt='Ropa Blanca' title='Ropa Blanca'><img src='img/blanca.png' alt='Ropablanca' title='Ropablanca'></button>"
        document.getElementById("modosdecolor").innerHTML=html;
    }
    //lavado estandar
    if(numcolor==2){
        let html="";
        html="Modo recomendado : Lavado estándar";
        document.getElementById("pruebiscula").innerHTML=html;
        html="";
        html="<h4 id='ropiscula'>Ropa</h4><button id='ropaoscura' alt='Ropa Oscura' title='Ropa Oscura'><img src='img/negra.png' alt='Ropaoscura' title='Ropaoscura'></button>"
        document.getElementById("modosdecolor").innerHTML=html;
    }
    if(numcolor==3){

        let html="";
        html="Modo recomendado : Lavado a fondo";
        document.getElementById("pruebiscula").innerHTML=html;
        html="";
        html="<h4 id='ropiscula'>Ropa</h4><button id='ropacolor' alt='Ropa Color' title='Ropa Color'><img src='img/color.png' alt='Ropacolor' title='Ropacolor'></button>"
        document.getElementById("modosdecolor").innerHTML=html;
    }
}

function secasao(){
    let html="";
    if(secacion==0){
        html='';
        html += '<h2>Para secar la ropa primero debes lavarla</h2>';
        document.getElementById("info").innerHTML=html;
    }
    else if(secacion==1){
        secado();
        secacion=0;
    }
}

function principales(){
      
      if(nummodo==0 && estalavando==0) valores2();
      valores();
      lavados();
      if(pausasion==0){
        document.getElementById('parar').style.pointerEvents = 'none';
      }
      else{
        document.getElementById('parar').style.pointerEvents = 'auto';

        var el = document.getElementById('parar');
        el.setAttribute("style", "background-color:lightgrey;");
      }
}