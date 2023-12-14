let key
let success = false
let userInfo

window.addEventListener('DOMContentLoaded', () => {
    
    //Login
    document.getElementById('loginForm').addEventListener('submit', (event) => {
        event.preventDefault()
        key = document.getElementById("key").value

        fetch('https://turniermesc.onrender.com/check-access', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ key: key })
        })
        .then(response => response.json())
        .then(data => {
            if (data.key === key) {
                userInfo = data.meta
                webSocketAccess()
                alert("Erfolgreich... Viel Glück beim Feuerwerk Einkaufslisten Turnier!")
                document.getElementById('waitingLobby').classList.remove('inactive')
                document.getElementById('logout').classList.remove('inactive')
                document.getElementById('ready').classList.remove('inactive')
                document.getElementById('loginForm').classList.add('inactive')
                success = true;
            } else if(data.key === 'INUSE') {
                alert("Dieser Token wird gerade benutzt, nur eine Session kann gleichzeitig pro Token laufen.")
            } else if(data.key === 'NOTAVAILABLE') {
                alert("MEsc hat noch keine Session gestartet.")
            } else if(data.key === 'STARTED') {
                alert("MEsc hat das Turnier bereits gestartet.")
            } else {
                alert("Falscher Token, Zugriff verweigert.")
            }
        }).catch((err) => alert(`Fehler, möglicherweie keine Verbindung zum Host (Code - ${err}).`))
    })

    //Logout
    document.getElementById('logout').addEventListener('click', () => {
        if(success) {
            success = false
            fetch('https://turniermesc.onrender.com/log-out', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ key: key })
            })
            .then(() => {
                document.getElementById('loginForm').classList.remove('inactive')
                document.getElementById('waitingLobby').classList.add('inactive')
                document.getElementById('logout').classList.add('inactive')
                document.getElementById('ready').classList.add('inactive')
                key = undefined
                document.getElementById("key").value = ''
            })
        }
    })
    /*window.addEventListener('beforeunload', () => {
        if(success) {
            success = false
            fetch('https://turniermesc.onrender.com/log-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key: key })
            })
        }
    })*/

    //Make Ready
    document.getElementById('ready').addEventListener('click', () => {
        if(!document.getElementById('ready').textContent.includes('✔️')) {
            document.getElementById('ready').textContent += '✔️'
            readyMsg() 
        }
    })

    document.getElementById('finished').addEventListener('click', () => {
        if(!document.getElementById('finished').textContent.includes('✔️')) {
            document.getElementById('finished').textContent += '✔️'
            finishedMsg()
        }
    })
})
