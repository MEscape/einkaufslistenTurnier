let socket
let curentPartner
let roundTimer
let sendToAdmin = false
let roundTime
let stopped = false

const webSocketAccess = () => {

    //Websocket
    socket = new WebSocket('wss://localhost:3000')
    socket.addEventListener('open', () => {
        console.log('Verbindung zum Server hergestellt')

        //ID Übergabe
        socket.send(JSON.stringify({ key: key }))

        //Updatet Wartende Spieler
        socket.addEventListener('message', event => {
            const data = JSON.parse(event.data)

            playerNumber(data)
            currentPlayer(data)
            startTurnier(data)
            kicked(data)
            readyState(data)
            positionPairs(data)
            getEditorData(data)
            checkCheated(data)
            showPoints(data)
            votingEnd(data)
            processNewPairs(data)
            winner(data)
            if (typeof alreadyFinished === 'function') { 
                alreadyFinished(data)
            }
        })

        fetch('https://localhost:3000/update-player', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        })
    })
}

const winner = (data) => {
    if(data.winner !== undefined) {
        document.querySelector('.effect').classList.remove('inactive')
        document.getElementById('lobbyMusic').setAttribute('src', key === 'MASTERme8sc5es3' ? '../audio/winning.mp3' : 'audio/winning.mp3')
        key === 'MASTERme8sc5es3' ? document.getElementById('roundTime').classList.add('inactive') : null
        key === 'MASTERme8sc5es3' ? document.getElementById('nextRound').classList.add('inactive') : null
        document.querySelector('.versusUser').innerHTML = ''
        document.querySelector('.versusUser').style.justifyContent = 'center'
        
        const winnerDisplay = document.createElement('div')
        winnerDisplay.classList.add('winner')

        const logo = document.createElement('img')
        logo.src = `${key === 'MASTERme8sc5es3' ? '../img/user/' : 'img/user/'}${data.winner.logo}`
        winnerDisplay.appendChild(logo)

        const header = document.createElement('h1')
        header.textContent = data.winner.name + (data.winner.youtuber == 1 ? ' 🔑' : '')
        winnerDisplay.appendChild(header)

        document.querySelector('.versusUser').appendChild(winnerDisplay)
    }
}

const processNewPairs = (data) => {
    if(data.newPairs !== undefined) {
        allPairs = data.newPairs
        let nPairs = data.newPairs

        if(data.newPairs.length === 1) {
            nPairs = []
            nPairs.push({one: data.newPairs[0].one, two: null})
            nPairs.push({one: null, two: data.newPairs[0].two})
        }

        let half = Math.floor(nPairs.length / 2)
        const halfs = [nPairs.slice(0, half), nPairs.slice(half)]

        halfs.forEach((part, k) => {
            const nextRound = document.createElement('div')

            part.forEach((pair, i) => {
                const section = preparePair(pair, nPairs, data.newPairs.length)
                nextRound.appendChild(section)
            })
            
            if(k === 1) {
                document.querySelector(`.versusUser > div:nth-child(${k+1})`).insertBefore(nextRound, document.querySelector(`.versusUser > div:nth-child(${k+1}) > div:nth-child(1)`))
            } else {
                document.querySelector(`.versusUser > div:nth-child(${k+1})`).appendChild(nextRound)
            }
        })

        if (typeof setCurrentState === 'function') { 
            setCurrentState()
        }
    }
}

const votingEnd = (data) => {
    if(data.votingEnd !== undefined) {
        if(data.votingEnd) {
            alert('Du hattest in dieser Runde leider nicht die Mehrheit für dich. Danke fürs teilnehmen.')
            location.reload()
        } else {
            alert('Herzlichen Glückwunsch. Du hattest in dieser Runde die Mehrheit für dich.')
            nextRound()
        }
    }
}

const nextRound = () => {
    document.getElementById('lobbyMusic').setAttribute('src', key === 'MASTERme8sc5es3' ? '../audio/earth.mp3' : 'audio/earth.mp3')
    key !== 'MASTERme8sc5es3' ? document.querySelector('.votingPending').classList.add('inactive') : null
    document.querySelector('.metaGame').classList.add('inactive')
    document.querySelector('.editArea').classList.add('inactive')
    document.querySelector('.versusUser').classList.remove('inactive')
    document.querySelector('.versus').classList.remove('inactive')
}

const showPoints = (data) => {
 if(data.ratingPoints !== undefined) {
    const progressBar = document.querySelector('progress')
    let value

    if(data.pos === 'right') {
        value = (data.ratingPoints.right / (data.ratingPoints.right + data.ratingPoints.left)) * 100
    } else {
        value = (data.ratingPoints.left / (data.ratingPoints.right + data.ratingPoints.left)) * 100
    }

    if (Number.isFinite(value)) {
        if(data.pos === 'right' && data.ratingPoints.right >= 0 && data.ratingPoints.left < 0) {
            progressBar.value = 100
        } else if(data.pos === 'left' && data.ratingPoints.left >= 0 && data.ratingPoints.right < 0) {
            progressBar.value = 100
        } else if(data.ratingPoints.left >= 0 && data.ratingPoints.right >= 0) {
            progressBar.value = value
        } else {
            progressBar.value = 0
        }
    } else {
        progressBar.value = 0
    }
 }
}

const checkCheated = (data) => {
    if(data.cheated !== undefined) {
        let response = confirm(`Der User ${data.cheated} hat nach Runden Ende versucht etwas an seiner Liste zu ändern!`)
        
        if(response) {
            fetch('https://localhost:3000/remove-player', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ target: data.cheated })
            })  
        }
    }

    if(data.roundEnd !== undefined) {
        clearInterval(roundTimer)
        document.querySelector('.time').textContent = ''
        alert('Die Runde wurde frühzeitig beendet, da alle fertig waren.')
        roundEnd()
    }
}

const roundEnd = () => {
    document.getElementById('lobbyMusic').setAttribute('src', key === 'MASTERme8sc5es3' ? '../audio/epic.mp3' : 'audio/epic.mp3')
    stopped = true
    document.querySelector('.editor').setAttribute('readOnly', '')

    if(key === 'MASTERme8sc5es3') {
        rating()
    }
}

const getEditorData = (data) => {
    if(data.editor !== undefined) {
        if(data.editor === 'GET') {
            if(stopped)
                document.querySelector('.votingPending').classList.remove('inactive')

            socket.send(JSON.stringify({ editor: document.querySelector('.editor').value, own: userInfo.key }))
            sendToAdmin = true
        } else if(data.editor === 'STOP') {
            sendToAdmin = false
        }else {
            if(data.own !== undefined) {
                userInsight(data)
            } else {
                document.querySelector('.partnerEditor').value = data.editor
            }
        }
    }
}

function formatTime(ms) {
    // Berechne Stunden, Minuten, Sekunden und Millisekunden
  var stunden = Math.floor(ms / 3600000);
  var restStunden = ms % 3600000;
  var minuten = Math.floor(restStunden / 60000);
  var restMinuten = restStunden % 60000;
  var sekunden = Math.floor(restMinuten / 1000);
  var millisekunden = restMinuten % 1000;

  // Stelle sicher, dass die Zahlen zweistellig sind
  stunden = stunden < 10 ? '0' + stunden : stunden;
  minuten = minuten < 10 ? '0' + minuten : minuten;
  sekunden = sekunden < 10 ? '0' + sekunden : sekunden;
  millisekunden = millisekunden < 10 ? '00' + millisekunden : (millisekunden < 100 ? '0' + millisekunden : millisekunden);

  // Gib das formatierte Ergebnis zurück
  return stunden + ':' + minuten + ':' + sekunden + '.' + millisekunden;
}


const roundIntro = (data) => {
    document.getElementById('lobbyMusic').setAttribute('src', key === 'MASTERme8sc5es3' ? '../audio/atmospheric.mp3' : 'audio/atmospheric.mp3')
    document.querySelector('.versus').classList.add('inactive')
    document.querySelector('.versusUser').classList.add('inactive')
    document.querySelector('.metaGame').classList.remove('inactive')
    document.getElementById('discounter').textContent = data.gamemode.discounter
    document.getElementById('kategory').textContent = data.gamemode.kategory
    document.getElementById('budget').textContent = data.gamemode.budget

    if (typeof setCurrentState === 'function') { 
        setCurrentState()
    }

    let timer = 3
    let settedTime = data.currentTime
    let countdown = setInterval(() => {
        document.querySelector('.time').textContent = `Die Runde startet in ${timer} Sekunden...`
        timer--

        if (timer < 0) {
            clearInterval(countdown)
            document.querySelector('.time').textContent = ''

            roundTimer = setInterval(() => {
                const passedTime = Date.now() - settedTime
                const timeLeft = roundTime - passedTime

                document.querySelector('.time').textContent = `Übrige Rundenzeit: ${formatTime(timeLeft)}`

                if(timeLeft < 0) {
                    clearInterval(roundTimer)
                    document.querySelector('.time').textContent = ''
                    alert('Die Zeit ist abgelaufen. Die Runde ist nun zu Ende.')
                    roundEnd()
                }
            }, 10)

            if(key !== 'MASTERme8sc5es3') {
                setMeta()
                document.getElementById('finished').classList.remove('inactive')
                document.querySelector('.partnerEditor').value = ''
                document.querySelector('.editor').value = ''
                document.querySelector('.editArea').classList.remove('inactive')
            } else {
                createCards()

                if (typeof setCurrentState === 'function') { 
                    setCurrentState()
                }
            }
        }
    }, 1000)
}

const setMeta = (rating) => {
    document.querySelector('.partner h1').textContent = curentPartner === null ? '-' : ((key === 'MASTERme8sc5es3' && rating === undefined) ? 'Player 1' : (curentPartner.name + (curentPartner.youtuber === 1 ? ' 🔑' : '')))
    document.querySelector('.partner img').setAttribute('src', (key === 'MASTERme8sc5es3' ? `../img/user/` : `img/user/`) + ((curentPartner === null || (key === 'MASTERme8sc5es3' && rating === undefined)) ? 'placeholder.png' : curentPartner.logo))
    document.querySelector('.partner img').setAttribute('alt', curentPartner === null ? 'None' : curentPartner.key)
    document.querySelector('.own h1').textContent = (key === 'MASTERme8sc5es3' && rating === undefined) ? 'Player 2' : ((rating === undefined ? 'Ich' : userInfo.name) + (userInfo.youtuber === 1 ? ' 🔑' : ''))
    document.querySelector('.own img').setAttribute('src', (key === 'MASTERme8sc5es3' ? `../img/user/` : `img/user/`) + ((key === 'MASTERme8sc5es3' && rating === undefined) ? 'placeholder.png' : userInfo.logo))
    document.querySelector('.own img').setAttribute('alt', userInfo.key)
    key !== 'MASTERme8sc5es3' ? document.querySelector('.editor').style.border = '2px solid red' : null
    document.querySelector('.partnerEditor').value = ''
    document.querySelector('.editor').value = ''
}

const preparePair = (pair, formattedPair, pairsLength) => {
    const section = document.createElement('section')

    for(let keyAttr in pair) {
        if(pair[keyAttr] !== null) {
            if(key === pair[keyAttr].key) {
                if(pairsLength !== undefined && pairsLength === 1) {
                    curentPartner = keyAttr === 'one' ? formattedPair[1].two : formattedPair[0].one
                } else {
                    curentPartner = keyAttr === 'one' ? pair['two'] : pair['one']
                }
            }

            const wrappInfo = document.createElement('div')
            wrappInfo.classList.add('placer')

            const logo = document.createElement('img')
            logo.src = `${key === 'MASTERme8sc5es3' ? '../img/user/' : 'img/user/'}${pair[keyAttr].logo}`
            wrappInfo.appendChild(logo)

            const header = document.createElement('h1')
            header.textContent = (key !== 'MASTERme8sc5es3' && userInfo.name === pair[keyAttr].name ? 'Ich' : pair[keyAttr].name) + (pair[keyAttr].youtuber == 1 ? ' 🔑' : '')
            wrappInfo.appendChild(header)

            section.appendChild(wrappInfo)
        } else {
            const wrappInfo = document.createElement('div')
            wrappInfo.classList.add('placer')
            section.appendChild(wrappInfo)
        }
    }

    return section
}

const positionPairs = (data) => {
    if(data.pairs !== undefined) {
        allPairs = data.pairs
        const versusArea = document.querySelector('.versusUser')
        const half = Math.floor(data.pairs.length / 2)
        const halfs = [data.pairs.slice(0, half), data.pairs.slice(half)]

        halfs.forEach(part => {
            const halfWrapper = document.createElement('div')
            const firstRound = document.createElement('div')

            part.forEach((pair, i) => {
                const section = preparePair(pair)
                firstRound.appendChild(section)
                halfWrapper.appendChild(firstRound)
            })

            versusArea.appendChild(halfWrapper)
        })
    }
}

const currentPlayer = (data) => {
    if(data.name !== undefined) {
        if(data.name.slice(0,4) === 'left') {
            const tableRow = Array.from(document.querySelector('.playerList').children)
            tableRow.forEach(row => {
                if(row.textContent === data.name.slice(5) || row.textContent.slice(0, -2) === data.name.slice(5)) {
                    row.remove()
                    if (typeof setCurrentState === 'function') { 
                        setCurrentState()
                    }
                }
            })
        } else {
            const tableRow = document.createElement('tr')
            const tableData = document.createElement('td')
            const a = document.createElement('a')
            a.textContent = data.name
            tableData.appendChild(a)
            tableRow.appendChild(tableData)
            document.querySelector('.playerList').appendChild(tableRow)

            if (typeof setCurrentState === 'function') { 
                setCurrentState()
            }

            tableRow.addEventListener('click', (event) => {
                kickPlayer(event.target.textContent)
            })
        }
    }
}

const readyState = (data) => {
    if(data.ready !== undefined) {
        document.querySelectorAll('.playerList a').forEach((a) => {
            if(a.textContent === data.ready) {
                a.textContent += '✔️';
            }
        })
        if (typeof setCurrentState === 'function') { 
            setCurrentState()
        }
    }
}

const playerNumber = (data) => {
    const playerCount = data.playerCount

    if(playerCount !== undefined && playerCount !== null) {
        document.querySelector("#waitingLobby h2").textContent = `Spieler - ${playerCount}/16`
        if (typeof setCurrentState === 'function') { 
            setCurrentState()
        }
    }
}

const readyMsg = () => {
    socket.send(JSON.stringify({ ready: key }))
}

const finishedMsg = () => {
    socket.send(JSON.stringify({ finished: key }))
}

const kicked = async (data) => {
    if(data.refresh === 'refresh') {
        alert('Du wurdest von MEsc gekickt.')
        location.reload()
    }
}

const startTurnier = async (data) => {
    if(data.action !== undefined) {
        if(data.action === 'startGame') {
            document.getElementById('stinger').setAttribute('src', key === 'MASTERme8sc5es3' ? '../vid/Stinger.mp4' : 'vid/Stinger.mp4')
            document.querySelector('.versusUser').classList.remove('inactive')
            document.getElementById('waitingLobby').classList.add('inactive')
            if(key !== 'MASTERme8sc5es3') {
                document.getElementById('logout').classList.add('inactive')
                document.getElementById('ready').classList.add('inactive')
            } else {
                document.getElementById('nextRound').classList.remove('inactive')
                document.getElementById('roundTime').classList.remove('inactive')
            }
            
            document.querySelector('.versus').classList.remove('inactive')

            setTimeout(() => {
                document.getElementById('stinger').setAttribute('src', '')
                document.getElementById('lobbyMusic').setAttribute('src', key === 'MASTERme8sc5es3' ? '../audio/earth.mp3' : 'audio/earth.mp3')
                document.getElementById('lobbyMusic').volume = 0.04

                if (typeof setCurrentState === 'function') { 
                    setCurrentState()
                }
            }, 6000)
        } else if(data.action === 'startRound') {
            key === 'MASTERme8sc5es3' ? document.querySelector('.voting').classList.add('inactive') : null
            key !== 'MASTERme8sc5es3' ? document.querySelector('.editor').removeAttribute('readOnly') : null
            key !== 'MASTERme8sc5es3' ? document.getElementById('finished').textContent = 'Klicken wenn fertig' : null
            key !== 'MASTERme8sc5es3' ? document.querySelector('progress').value = 0 : null
            stopped = false
            roundTime = data.time
            roundIntro(data)
        }
    }
}

if(key !== 'MASTERme8sc5es3' || sendToAdmin) {
    let timeoutId
    const debounceTime = 1000
    
    document.querySelector('.editor').addEventListener('keyup', () => {
        if(stopped && !document.querySelector('.editor').hasAttribute('readonly')) {
            socket.send(JSON.stringify({ cheated: userInfo.name }))
            stopped = false
        }

        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            if(curentPartner !== null) 
                socket.send(JSON.stringify({ editor: document.querySelector('.editor').value, partner: curentPartner.key }))
            
            if(sendToAdmin) 
                socket.send(JSON.stringify({ editor: document.querySelector('.editor').value, own: userInfo.key }))
            
        }, debounceTime)
    })
}