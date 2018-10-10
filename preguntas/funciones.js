function seleccionarCorrectas() {
    let all = document.querySelectorAll( "*" );
    var res = new Array();

    for ( let i = 0; i < all.length; i++ ) {
        var act = all[i];
        var attr = act.getAttribute && act.getAttribute( "style" );

        if ( typeof attr == "string" && attr.length > 0 )
            if ( attr.toString().includes( "color: lime" ) )
                res.push( act );
    }

    return res;
}

function agregarMarcador( marcador ) {
    let correctas = seleccionarCorrectas();

    for ( let i = 0; i < correctas.length; i++ ) {
        let pre = correctas[i].cloneNode( true );

        correctas[i].innerHTML = "#";
        correctas[i].appendChild( pre );
    }
}

agregarMarcador( "#" );

// Historia 242
// Geografia 327
// Deportes 273
// Ciencia y tecnologia 398
// Arte y literatura 308
// Entretenimiento 224

// Total: 1772

// Usables: 1622