const fs = require("fs");
const { clienteAtivo } = require("./validacao");
const path = require('path')

module.exports = {
    ativarTarefa: (taskId, configCliente, config) => {
        if ( !clienteAtivo(taskId, config) ) {
            let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
            registros.ativo = { ...registros.ativo, [taskId]: configCliente }
            fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        }
        return true
    },
    inativarTarefa: (taskId, idCliente) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        let task = clienteAtivo(taskId, config)
        if ( task ) {
            let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config[idCliente].MODEL_LOCAL)))
            registros.inativo = { ...registros.inativo, [taskId]: task }
            delete registros.ativo[taskId]
            fs.writeFileSync(path.join(absolutePath(), config[idCliente].MODEL_LOCAL), JSON.stringify(registros))
        }
        return true
    },
    reativarTarefa: (taskId, idCliente) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        let task = clienteInativo(taskId)
        if ( task ) {
            let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config[idCliente].MODEL_LOCAL)))
            registros.ativo = { ...registros.inativo, [taskId]: task }
            delete registros.inativo[taskId]
            fs.writeFileSync(config[idCliente].MODEL_LOCAL, JSON.stringify(registros))
        }
        return true
    },
    ativarCliente: (telefone, taskId, config) => {
        // let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        registros.ativo = { ...registros.ativo, [telefone]: { taskId: taskId } }
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    inativarCliente: (telefone, idCliente) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config[idCliente].MODEL_LOCAL)))
        delete registros.ativo[telefone]
        fs.writeFileSync(path.join(absolutePath(), config[idCliente].MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    addCommentIdTarefa: function(taskId, commentId, id_whatsapp, timestamp, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        registros.ativo[taskId].limpar_msg_saida = { ...registros.ativo[taskId].limpar_msg_saida, [commentId]: { id_whatsapp, timestamp } }
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    deleteCommentIdTarefa: function(taskId, commentId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        delete registros.ativo[taskId].limpar_msg_saida[commentId]
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    getCommentIdTarefa: function(taskId, commentId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        return ( registros.ativo[taskId].limpar_msg_saida[commentId] || false )
    },
    getCommentsTarefa: function(taskId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        return ( registros.ativo[taskId].limpar_msg_saida || false )
    },
    addUltimoCommentIdUser: function(user, commentId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        registros.ativo[user].ultima_msg_enviada = commentId
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    addCommentIdUser: function(user, whatsappId, commentId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        registros.ativo[user].msgs_enviada = { ...registros.ativo[user].msgs_enviada, [whatsappId]: commentId }
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },
    deleteCommentIdUser: function(user, whatsappId, config) {
        let registros = JSON.parse(fs.readFileSync(path.join(absolutePath(), config.MODEL_LOCAL)))
        delete registros.ativo[user].msgs_enviada[whatsappId]
        fs.writeFileSync(path.join(absolutePath(), config.MODEL_LOCAL), JSON.stringify(registros))
        return true
    },	
    baixarArquivoPorUrl: async function(uri, filename){
        const cp = require('child_process');
        // let command = `curl -o .\\src\\attachments\\recebidos\\"${filename}" ${uri}`;
		let command = `curl -o ./attachments/recebidos/"${ filename }" ${uri}`;
        let result = cp.execSync(command);
        console.log(result)
        return true
    },
	validateNumberWhatsapp: async function(client, number) {
        var phoneId = await client.getNumberId(`55${ number.toString().replace('+55','').replace(/\(*\)*\ *\-*\.*\,*\_*/g, '') }`)
		if(phoneId) {
            return phoneId._serialized
        } else {
            return false
        }
    },
	validateTimeDeleteMessageWhatsapp: function(timestamp) {
        let now = new Date()
        let dateMessage = new Date( ( timestamp * 1000 ) )
        // let dateMessageFormatada = dateMessage.toLocaleString('pt-br')
        if ( ( now.getTime() - dateMessage.getTime() ) < 3600000 ) {
            return true // dentro da uma hora limite do whatsapp para apagar mensagens
        }else {
            return false
        }
    },
    deleteMessageWhatsapp: async function(client, phoneNumber, message_id) {
        let chat = await client.getChatById(phoneNumber)
        let messages = await chat.fetchMessages({ limit: 100 });
        for (let messageChat of messages){
            if (messageChat._data.id.fromMe && messageChat._data.id.id == message_id) {
                let resp = await messageChat.delete(true)
                console.log(resp)
                break
            }
        }
        return true
    },
    dataHotaAtual: function() {
        return `\x1b[33m => ${new Date().toLocaleString('pt-BR')} \x1b[0m`
    },
    dataHotaAtualSimples: function() {
        // let data = new Date().toLocaleString('pt-BR')
        // console.log(data)
        // let dia = data.slice(7, 8).padStart(2, '0')
        // let mes = data.slice(5, 6).padStart(2, '0')
        // let ano = data.slice(0, 4)
        // let hora = data.slice(9)
        // data = `${ dia }/${ mes }/${ ano } ${ hora }`
        return new Date().toLocaleString('pt-BR') //.substr(0, 19).split('-').reverse().join('/') //toLocaleDateString
    },
    resetClientesConfigSet: (idsCliente, param) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        for ( let idCliente of idsCliente ) {
            config[idCliente][param.tipo1] = param.value
            config[idCliente][param.tipo2] = param.value
            let caminho = path.join(absolutePath(), '/pages/assets/') + config[idCliente].nome_qrcode + '.svg'
            if ( fs.existsSync(caminho) ) fs.unlinkSync(caminho)
        }
        fs.writeFileSync(path.join(absolutePath(), '/model/config.json'), JSON.stringify(config))
        return true
    },
    clienteConfigSet: (idCliente, param) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        if ( typeof config[idCliente] != 'undefined' ) config[idCliente][param.tipo] = param.value
        else {
            config = { ...config, [idCliente]: { nome_qrcode: "", autenticado: false, inicializado: false } }
            config[idCliente][param.tipo] = param.value
        }
        fs.writeFileSync(path.join(absolutePath(), '/model/config.json'), JSON.stringify(config))
        return true
    },
    setConfigClickup: (idCliente, token, idLista, idTeam, idUserMaster) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        if ( typeof config[idCliente] != 'undefined' ) {
            config[idCliente]['TOKEN'] = token
            config[idCliente]['ID_LISTA_CLIENTES'] = idLista
            config[idCliente]['ID_TEAM_CLICKUP'] = idTeam
            config[idCliente]['USER_MASTER'] = idUserMaster
        }else {
            config[idCliente] = {}
            config[idCliente]["nome_qrcode"] = "",
            config[idCliente]["autenticado"] = false,
            config[idCliente]["inicializado"] = false,
            config[idCliente]["falha"] = false,
            config[idCliente]["BASE_URL"] = "https://api.clickup.com/api/v2",
            config[idCliente]['TOKEN'] = token
            config[idCliente]['MODEL_LOCAL'] = `/model/${ idCliente }.json`
            config[idCliente]['ID_LISTA_CLIENTES'] = idLista
            config[idCliente]['ID_TEAM_CLICKUP'] = idTeam
            config[idCliente]['TELEFONE_NOTIFICACAO'] = idCliente + "@c.us"
            config[idCliente]['USER_MASTER'] = idUserMaster
        }
        let configClienteClickup = {
            "ativo": {},
            "inativo": {}
        }
        fs.writeFileSync(path.join(absolutePath(), '/model/config.json'), JSON.stringify(config))
        fs.writeFileSync(path.join(absolutePath(), `/model/${ idCliente }.json`), JSON.stringify(configClienteClickup))
    },
    configGetCliente: (idCliente) => {
        let config = JSON.parse(fs.readFileSync(path.join(absolutePath(), '/model/config.json')))
        return config[idCliente] || false
    },
    deletarArquivo: (path) => { 
        console.log(path)
        if ( fs.existsSync(path)) { fs.unlinkSync(path); return true }
        else return false
    },
    sleep: function(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    // deletarArquivo: async function(path){
    //     const cp = require('child_process');
    //     let command = `del ${path.replace('/', '\\').replace('/', '\\').replace('/', '\\').replace('/', '\\')}`;
    //     let result = cp.execSync(command);
    //     console.log(result)
    //     return true
    // }
}

function absolutePath() { return __dirname.replace('\\utils', '').replace('/utils', '') }

