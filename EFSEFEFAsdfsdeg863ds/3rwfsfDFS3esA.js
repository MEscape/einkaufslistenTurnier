const key = 'MASTERme8sc5es3'
let allPairs
let ratingPoints = {left: 0, right: 0, MEsc: {left: false, right: false}, PyroFeuerHD: {left: false, right: false}, Viewer: {left: false, right: false}}

window.addEventListener('DOMContentLoaded', () => {
    fetch('https://turniermesc.onrender.com/get-player')
    .then(response => response.json())
    .then(data => {
        if(data.playerCount != 0)
            getCurrentState()
    })
    .catch(error => console.error('Fehler:', error));

    webSocketAccess()

    document.getElementById('start').addEventListener('click', () => {
        let userResponse = confirm("Battle wirklich starten?")

        if(userResponse) {
            socket.send(JSON.stringify({ action: 'startGame' }))
        }
    })

    document.getElementById('nextRound').addEventListener('click', () => {
        let userResponse = confirm("Runde wirklich starten?")

        if(userResponse) {
            document.getElementById('nextRound').classList.add('inactive')
            document.getElementById('roundTime').classList.add('inactive')
            socket.send(JSON.stringify({ action: 'startRound', time: document.getElementById('roundTime').value*60000 }))
        }
    })

    document.getElementById('backVS').addEventListener('click', () => {
        document.querySelector('.editArea').classList.add('inactive')
        document.querySelector('.playground').classList.remove('inactive')
        document.getElementById('backVS').classList.add('inactive')

        document.querySelector('.editor').value = ''
        document.querySelector('.partnerEditor').value = ''

        socket.send(JSON.stringify({ stopTransfer: true}))
    })
})

const setCurrentState = () => {
    const htmlContent = document.documentElement.innerHTML
    
    // Speichern Sie den Inhalt im localStorage
    localStorage.setItem('indexHTML', htmlContent)
}

const getCurrentState = () => {
    let stdHtmlContent = document.documentElement.innerHTML
    const savedHTMLContent = localStorage.getItem('indexHTML')

    if(stdHtmlContent !== savedHTMLContent && savedHTMLContent !== undefined && savedHTMLContent !== null) {
        document.documentElement.innerHTML = savedHTMLContent

        document.querySelectorAll('.playerList tr').forEach((tr, i) => {
            if(i > 0) {
                tr.addEventListener('click', (event) => {
                    kickPlayer(event.target.textContent)
                })
            }
        })
    }
}

const kickPlayer = (target) => {
    if(target.includes('✔️'))
        target = target.slice(0, -2)

    let userResponse = confirm(`Willst du ${target} wirklich kicken?`)

    if(userResponse) {
        fetch('https://turniermesc.onrender.com/remove-player', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ target: target })
        })  
    }
}

const createCards = () => {
    document.querySelector('.playground').innerHTML = ''
    document.querySelector('.playground').classList.remove('inactive')

    allPairs.forEach(pair => {
        const card = document.createElement('div')
        card.classList.add('cardPair')
        card.classList.add('rgb')
        card.setAttribute('title', `${pair.one.name}${pair.two === null ? `` : `-VS-${pair.two.name}`}`)
        const displayer = document.createElement('div')
        displayer.classList.add('white')

        for(let keyAttr in pair) {
            if(pair[keyAttr] !== null) {
                const logo = document.createElement('img')
                logo.src = `../img/user/${pair[keyAttr].logo}`
                logo.alt = pair[keyAttr].key
                displayer.appendChild(logo)
                const VS = document.createElement('h2')
                VS.textContent = 'VS'
                displayer.appendChild(VS)
            }
        }

        displayer.lastElementChild.remove()
        card.appendChild(displayer)
        document.querySelector('.playground').appendChild(card)

        card.addEventListener('click', (event) => {
            document.getElementById('backVS').classList.remove('inactive')
            document.querySelector('.editArea').classList.remove('inactive')
            document.querySelector('.playground').classList.add('inactive')
            let result = allPairs.find(({ one }) => one.key === event.target.firstElementChild.firstElementChild.getAttribute('alt'))
            result === undefined || null ? result = allPairs.find(({ two }) => two.key === event.target.firstElementChild.firstElementChild.getAttribute('alt')) : null
            userInfo = result.one
            curentPartner = result.two

            setMeta()

            socket.send(JSON.stringify({ visit: {
                one: event.target.firstElementChild.firstElementChild.getAttribute('alt'),
                two: event.target.firstElementChild.lastElementChild.getAttribute('alt')
            }}))
        })
    })
}

const userInsight = (data) => {
    const editors = document.querySelectorAll('.editWrapper')
    editors.forEach(editor => {
        const editorKey = editor.firstElementChild.firstElementChild.getAttribute('alt')

        if(editorKey === data.own) {
            editor.lastElementChild.value = data.editor
        }
    })
}

const alreadyFinished = (data) => {
    if(data.alreadyFinished !== undefined) {
        alert(`${data.alreadyFinished} von ${data.possible} Teilnehmer haben ihre Liste bereits fertig.`)
    }
}

let counter = 0

const rating = () => {
    document.getElementById('backVS').classList.add('inactive')
    document.querySelector('.editArea').classList.remove('inactive')
    document.querySelector('.playground').classList.add('inactive')
    document.querySelector('.voting').classList.remove('inactive')
    counter = 0

    nextPair(allPairs[0])
}

let currentPair

const pointExchange = (radios) => {
    const progressBar = document.querySelector('progress')

    const userSelect = (radio, type, add, specificRemove) => {
        if(add) {
            if(radio.classList.contains('left')) {
                ratingPoints.left += type === 'heavy' ? 2 : 1
            } else {
                ratingPoints.right += type === 'heavy' ? 2 : 1
            }
        } else {
            if((specificRemove === undefined && radio.classList.contains('left')) || (specificRemove !== undefined && radio.classList.contains('right'))) {
                ratingPoints.left -= type === 'heavy' ? 2 : 1
            } else {
                ratingPoints.right -= type === 'heavy' ? 2 : 1
            }
        }

        let value = (ratingPoints.left / (ratingPoints.right + ratingPoints.left)) * 100
        if (Number.isFinite(value)) {
            if(ratingPoints.left >= 0 && ratingPoints.right < 0) {
                progressBar.value = 100
            } else if(ratingPoints.left >= 0 && ratingPoints.right >= 0) {
                progressBar.value = value
            } else {
                progressBar.value = 0
            }
        } else {
            progressBar.value = 0
        }
    }

    if(counter === 0) {
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                switch(radio.getAttribute('name')) {
                    case 'MEsc':
                        if((radio.classList.contains('left') && !ratingPoints.MEsc.right) || (radio.classList.contains('right') && !ratingPoints.MEsc.left)) {
                            userSelect(radio, 'normal', true)
                        } else if((radio.classList.contains('left') && ratingPoints.MEsc.right) || (radio.classList.contains('right') && ratingPoints.MEsc.left)) {
                            userSelect(radio, 'normal', false, 'remove')
                            userSelect(radio, 'normal', true)
                            if(ratingPoints.MEsc.left) {
                                ratingPoints.MEsc.left = false
                                ratingPoints.MEsc.right = true
                            } else {
                                ratingPoints.MEsc.left = true
                                ratingPoints.MEsc.right = false
                            }
                        }
                        
                        radio.classList.contains('left') ? ratingPoints.MEsc.left = true : ratingPoints.MEsc.right = true
                        break
                    case 'PyroFeuerHD':
                        if((radio.classList.contains('left') && !ratingPoints.PyroFeuerHD.right) || (radio.classList.contains('right') && !ratingPoints.PyroFeuerHD.left)) {
                            userSelect(radio, 'normal', true)
                        } else if((radio.classList.contains('left') && ratingPoints.PyroFeuerHD.right) || (radio.classList.contains('right') && ratingPoints.PyroFeuerHD.left)) {
                            userSelect(radio, 'normal', false, 'remove')
                            userSelect(radio, 'normal', true)
                            if(ratingPoints.PyroFeuerHD.left) {
                                ratingPoints.PyroFeuerHD.left = false
                                ratingPoints.PyroFeuerHD.right = true
                            } else {
                                ratingPoints.PyroFeuerHD.left = true
                                ratingPoints.PyroFeuerHD.right = false
                            }
                        }
                        
                        radio.classList.contains('left') ? ratingPoints.PyroFeuerHD.left = true : ratingPoints.PyroFeuerHD.right = true
                        break
                    case 'Viewer':
                        if((radio.classList.contains('left') && !ratingPoints.Viewer.right) || (radio.classList.contains('right') && !ratingPoints.Viewer.left)) {
                            userSelect(radio, 'heavy', true)
                        } else if((radio.classList.contains('left') && ratingPoints.Viewer.right) || (radio.classList.contains('right') && ratingPoints.Viewer.left)) {
                            userSelect(radio, 'heavy', false, 'remove')
                            userSelect(radio, 'heavy', true)
                            if(ratingPoints.Viewer.left) {
                                ratingPoints.Viewer.left = false
                                ratingPoints.Viewer.right = true
                            } else {
                                ratingPoints.Viewer.left = true
                                ratingPoints.Viewer.right = false
                            }
                        }
                        
                        radio.classList.contains('left') ? ratingPoints.Viewer.left = true : ratingPoints.Viewer.right = true
                        break
                    case 'tolerance':
                        userSelect(radio, 'normal', !radio.checked ? true : false)
                        break
                    case 'wrongTopic':
                        userSelect(radio, 'heavy', !radio.checked ? true : false)
                        break
                }
                socket.send(JSON.stringify({ ratingPoints: ratingPoints, keyRight: currentPair.one.key, keyLeft: currentPair.two === null ? null : currentPair.two.key}))
            })
        })
    }
}

const resetPoints = () => {
    document.querySelector('progress').value = 0
    ratingPoints.left = 0
    ratingPoints.right = 0
    ratingPoints.MEsc.left = false
    ratingPoints.MEsc.right = false
    ratingPoints.PyroFeuerHD.left = false
    ratingPoints.PyroFeuerHD.right = false
    ratingPoints.Viewer.left = false
    ratingPoints.Viewer.right = false
}

const finishVoting = () => {
    const radios = document.querySelectorAll(`input[type="radio"], input[type="checkbox"]`)
    radios.forEach(radio => {
        radio.checked = false
    })
    resetPoints()
    nextRound()
    document.getElementById('nextRound').classList.remove('inactive')
    socket.send(JSON.stringify({ allVotingFinished: allPairs }))
}

const nextPair = async (pair) => {
    resetPoints()
    const radios = document.querySelectorAll(`input[type="radio"], input[type="checkbox"]`)
    currentPair = pair
    pointExchange(radios)

    userInfo = pair.one
    curentPartner = pair.two
    setMeta()

    socket.send(JSON.stringify({
        visit: {
            one: pair.one.key,
            two: pair.two !== null ? pair.two.key : null
        }
    }))

    await new Promise((resolve) => {
        const button = document.getElementById('fetchResult')
        const radioGroups = ['MEsc', 'PyroFeuerHD', 'Viewer']

        const clickHandler = () => {
            const areAllRadioGroupsChecked = radioGroups.every(name => document.querySelector(`input[name="${name}"]:checked`) !== null)
            if (areAllRadioGroupsChecked && ratingPoints.left !== ratingPoints.right) {
                setMeta(true)
                
                if(ratingPoints.left > ratingPoints.right) {
                    console.log('left')
                    socket.send(JSON.stringify({ votingEnd: currentPair.one.key, votingContinue: currentPair.two !== null ? currentPair.two.key : null }))
                } else {
                    socket.send(JSON.stringify({ votingEnd: currentPair.two !== null ? currentPair.two.key : null, votingContinue: currentPair.one.key }))
                }

                radios.forEach(radio => {
                    radio.checked = false
                })

                if (allPairs.length > counter + 1) {
                    alert('Nächstes Voting wird geladen.')
                } else {
                    alert('Runde abgeschlossen.')
                }

                button.removeEventListener('click', clickHandler)

                resolve()
            }
        };

        button.addEventListener('click', clickHandler)
    });

    counter++

    if (allPairs.length > counter) {
        nextPair(allPairs[counter])
    } else {
        finishVoting()
    }
};
