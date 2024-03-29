const {
    enviarMensagem, getAttachmentsTarefa, getStatusWebhook, atualizarWebhook, removeTagTarefa, getCamposExtraTarefa, Tiny
} = require("../services/requests.js");

const {
    ativarTarefa, ativarCliente, deletarArquivo, addCommentIdTarefa, validateTimeDeleteMessageWhatsapp,
    deleteCommentIdTarefa, getCommentsTarefa, addUltimoCommentIdUser, baixarArquivoPorUrl, validateNumberWhatsapp,
    addCommentIdUser, dataHotaAtual
} = require("./utils.js");
const { tarefaAtiva, validaEnvioMensagem } = require("./validacao");
const { createLogErroWhatsapp } = require('./logs')
const { listarPedido, escreverPedidoEmTask } = require('../google')
const path = require('path')


module.exports = {
    whatsappOff: async (body, config) => {
        if (validaEnvioMensagem(body, config)) {
            await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nParece que você não está logado no whatsapp, entre no sistema e inicie a sessão.", config)
            return true
        }
    },
    receiverWebhookClickup: async (client, body, idCliente, res, config) => {
        //  console.log(body.history_items[0].comment.comment)//(body.history_items[0].comment.comment)
        try {
            if (typeof body.history_items[0].comment == 'undefined' || typeof body.history_items[0].comment.comment == 'undefined') return true
            if (typeof body.history_items[0].comment.comment[0].text == 'undefined' || typeof body.history_items[0].comment.comment[body.history_items[0].comment.comment.length - 1].text == 'undefined') return true
            body.history_items[0].comment.comment = body.history_items[0].comment.comment[body.history_items[0].comment.comment.length - 1].text == '\n' ? body.history_items[0].comment.comment.slice(0, body.history_items[0].comment.comment.length - 1) : body.history_items[0].comment.comment
            if (validaEnvioMensagem(body, config)) {
                // let msgLiberada = body.history_items[0].comment.comment.filter(text => text.text.toString().slice(0, 2) == "==")
                let msgLiberadaComUser = body.history_items[0].comment.comment.filter(text => text.text.toString().includes("=="))
                let msgLiberadaSemUser = body.history_items[0].comment.comment.filter(text => text.text.toString().includes("--"))
                let atualizaInfoTask = body.history_items[0].comment.comment.filter(text => text.text.toString().includes("-pedido"))
                let atualizaVoltagemPedido = body.history_items[0].comment.comment.filter(text => text.text.toString().includes("-voltagem"))
                if (atualizaVoltagemPedido.length > 0) {
                    let numeroPedido = atualizaVoltagemPedido[0].text.replace('-voltagem ', '').trim()
                    res.status(200).json({ retorno: { status: 'OK' } })
                    if (numeroPedido != "") {
                        let pedido = await listarPedido(numeroPedido)
                        if (pedido.status == 'Pedido não localizado' || pedido.status == 'Pedido não localizado') {
                            await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.", config)
                            await client.sendMessage(config.TELEFONE_NOTIFICACAO, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.")
                            return true
                        }
                        await Tiny.incluirMarcadorPedido(pedido.loja, pedido.id_pedido, config)
                        await Tiny.atualizarStatusPedido(pedido.loja, pedido.id_pedido, config)
                        return true
                    } else {
                        await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.", config)
                        return true
                    }
                } else if (atualizaInfoTask.length > 0) {
                    // aqui colocar infos do pedido na tarefa
                    let numeroPedido = atualizaInfoTask[0].text.replace('-pedido ', '').trim()
                    res.status(200).json({ retorno: { status: 'OK' } })
                    try {
                        if (numeroPedido != "") {
                            let pedido = await listarPedido(numeroPedido)
                            if (pedido.status == 'Pedido não localizado' || pedido.status == 'Pedido não localizado') {
                                await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.", config)
                                await client.sendMessage(config.TELEFONE_NOTIFICACAO, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.")
                                return true// res.status(200).json({ retorno: { status: 'ERRO' } })
                            }
                            await escreverPedidoEmTask(body.task_id, pedido)
                            return true// res.status(200).json({ retorno: { status: 'OK' } })
                        } else {
                            await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.", config)
                            return true// res.status(200).json({ retorno: { status: 'ERRO' } })
                        }
                    } catch (erro) {
                        await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nErro ao buscar dados do Pedido. Revise o número do pedido e tente novamente.", config)
                        return false// res.status(200).json({ retorno: { status: 'ERRO' } })
                    }
                } else if (msgLiberadaComUser.length == 0 || msgLiberadaSemUser.length > 0) {
                    let task = tarefaAtiva(body.task_id, config)
                    if (!task) {
                        let responseFields = await getCamposExtraTarefa(body.task_id, config)
                        //  console.log(responseFields)
                        if (responseFields.erro) {
                            createLogErroWhatsapp('whatsapp', responseFields.erro, { taskId: body.task_id, comment: body.history_items[0].comment })
                            await client.sendMessage(config.TELEFONE_NOTIFICACAO, `01-Não foi possivel enviar a mensagem ao destinatário no WhatsApp com a tarefa:\n${body.task_id}`)
                        } else {
                            let resultTelefone = responseFields.filter(item => item.name == "WhatsApp")
                            // console.log(resultTelefone)
                            // if (resultTelefone.length > 0) {
                            if (resultTelefone.length > 0 && typeof resultTelefone[0].value != 'undefined') {
                                // let telefoneCliente = `55${resultTelefone[0].value.toString().replace(/5*\(*\)*\ *\+*\-*/g, '')}@c.us`							
                                let telefoneCliente = await validateNumberWhatsapp(client, resultTelefone[0].value)
                                if (telefoneCliente) {
                                    ativarTarefa(body.task_id, { user: telefoneCliente }, config)
                                    ativarCliente(telefoneCliente, body.task_id, config)
                                    task = tarefaAtiva(body.task_id, config)
                                    if (!task) {
                                        client.sendMessage(config.TELEFONE_NOTIFICACAO, `02-Não foi possivel enviar a mensagem ao destinatário no WhatsApp com a tarefa:\n${body.task_id}`)
                                    }
                                    //								let mensagem = ( msgLiberadaSemUser.length == 0 ? `*${body.history_items[0].comment.user.username.split(' ')[0]}:*\n` : "" )
                                    let mensagem = ""
                                    var arquivoEnviado = false
                                    let commentId = body.history_items[0].comment.id
                                    for (var comment of body.history_items[0].comment.comment) {
                                        if (typeof comment.type != 'undefined' && comment.type == "attachment") {
                                            let result = await getAttachmentsTarefa(body.task_id, config)
                                            if (result.erro) {
                                                createLogErroWhatsapp('whatsapp', result.erro, { taskId: body.task_id, comment: body.history_items[0].comment })
                                                await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`)
                                                await enviarMensagem(body.task_id, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`, config)
                                            } else {
                                                let attachment = result.filter(attachment => attachment.title == comment.text)
                                                //  console.log(attachment)
                                                if (attachment.length == 0) {
                                                    await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`)
                                                    await enviarMensagem(body.task_id, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`, config)
                                                } else {
                                                    baixarArquivoPorUrl(attachment[0].url, comment.text)
                                                    let pathArquivo = path.join(absolutePath(), `/attachments/recebidos/${comment.text}`)
                                                    //												await client.sendMessage(task.user, `*${ body.history_items[0].comment.user.username.split(' ')[0] }:*\n`)
                                                    let mensagemArquivoEnviada = await client.sendMessage(task.user, MessageMedia.fromFilePath(pathArquivo), { sendAudioAsVoice: true })
                                                    addCommentIdTarefa(body.task_id, commentId, mensagemArquivoEnviada._data.id.id, mensagemArquivoEnviada.timestamp, config) // add id dos comentários no arquivo .json BD
                                                    addUltimoCommentIdUser(task.user, commentId, config) // add ao arquivo .json na camada de user ultima mensagem enviada do clickup ao whatsapp
                                                    addCommentIdUser(task.user, mensagemArquivoEnviada._data.id.id, commentId, config)
                                                    deletarArquivo(pathArquivo)
                                                    await removeTagTarefa(body.task_id, config)
                                                    // limpar registros de mensagens que expiraram(passaram de 1 hora no registro)
                                                    let msgs = getCommentsTarefa(body.task_id, config)
                                                    for (var msg of Object.entries(msgs)) {
                                                        if (!validateTimeDeleteMessageWhatsapp(msg[1].timestamp)) deleteCommentIdTarefa(body.task_id, msg[0], config)
                                                    }
                                                    arquivoEnviado = true
                                                    //												return res.status(200).json({ retorno: { status: 'OK' } })
                                                }
                                            }
                                        } else {
                                            mensagem += comment.text.replace('==', '').replace('--', '').replace('\n✓', '').replace('\n✓✓', '').replace('\n✕', '')
                                        }
                                    }
                                    if (!arquivoEnviado) {
                                        mensagem = ((msgLiberadaSemUser.length == 0 ? `*${body.history_items[0].comment.user.username.split(' ')[0]}:*\n` : "") + mensagem)
                                    }
                                    let mensagemEnviada = await client.sendMessage(task.user, mensagem.replace('**', '*').replace('**', '*'))
                                    addCommentIdTarefa(body.task_id, commentId, mensagemEnviada._data.id.id, mensagemEnviada.timestamp, config) // add id dos comentários no arquivo .json BD
                                    addUltimoCommentIdUser(task.user, commentId, config) // add ao arquivo .json na camada de user ultima mensagem enviada do clickup ao whatsapp								
                                    addCommentIdUser(task.user, mensagemEnviada._data.id.id, commentId, config)
                                    await removeTagTarefa(body.task_id, config)
                                    // limpar registros de mensagens que expiraram(passaram de 1 hora no registro)
                                    let msgs = getCommentsTarefa(body.task_id, config)
                                    for (var msg of Object.entries(msgs)) {
                                        if (!validateTimeDeleteMessageWhatsapp(msg[1].timestamp)) deleteCommentIdTarefa(body.task_id, msg[0], config)
                                    }
                                    let telefoneClienteCadastradoNaTarefa = `55${resultTelefone[0].value.toString().replace('+55', '').replace(/\(*\)*\ *\-*/g, '')}`

                                    //    if ( telefoneClienteCadastradoNaTarefa.length < telefoneCliente.replace('@c.us','').length ) await enviarMensagem(body.task_id, "*** ATENÇÃO ***\nPrecisa inserir o nono dígito no numero cadastrado nesta tarefa.")
                                } else {
                                    await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nO telefone informado NÃO possui WhatsApp ativo. Insira um número válido e reenvie a mensagem.", config, "Integração:\n")

                                    await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nO telefone informado NÃO possui WhatsApp ativo. Insira um número válido e reenvie a mensagem.\n*Tarefa:* ${body.task_id}`)
                                }
                            } else {
                                // await client.sendMessage(config.TELEFONE_NOTIFICACAO, `SeParece que não temos o campo Whatsapp para enviar msg para o cliente com a tarefa:\n${body.task_id}`)
                                await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nO campo WhatsApp está vazio\nPara enviar mensagem interna, inicie a mensagem com ==", config, "Integração:\n")
                            }
                        }
                    } else {

                        //					let mensagem = ( msgLiberadaSemUser.length == 0 ? `*${body.history_items[0].comment.user.username.split(' ')[0]}:*\n` : "" )
                        let mensagem = ""
                        var arquivoEnviado = false
                        let commentId = body.history_items[0].comment.id
                        for (var comment of body.history_items[0].comment.comment) {
                            if (typeof comment.type != 'undefined' && comment.type == "attachment") {
                                let result = await getAttachmentsTarefa(body.task_id, config)
                                if (result.erro) {
                                    createLogErroWhatsapp('whatsapp', result.erro, { taskId: body.task_id, comment: body.history_items[0].comment })
                                    await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`)
                                    await enviarMensagem(body.task_id, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`, config)
                                } else {
                                    let attachment = result.filter(attachment => attachment.title == comment.text)
                                    // console.log(attachment)
                                    if (attachment.length == 0) {
                                        await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`)
                                        await enviarMensagem(body.task_id, `*** ATENÇÃO: MSG DO SISTEMA ***\nO arquivo ${comment.text} não pôde ser enviado. REENVIE O ARQUIVO.`, config)
                                    } else {
                                        baixarArquivoPorUrl(attachment[0].url, comment.text)
                                        let pathArquivo = path.join(absolutePath(), `/attachments/recebidos/${comment.text}`)
                                        //									await client.sendMessage(task.user, `*${ body.history_items[0].comment.user.username.split(' ')[0] }:*\n`)
                                        let mensagemArquivoEnviada = await client.sendMessage(task.user, MessageMedia.fromFilePath(pathArquivo), { sendAudioAsVoice: true })
                                        addCommentIdTarefa(body.task_id, commentId, mensagemArquivoEnviada._data.id.id, mensagemArquivoEnviada.timestamp, config) // add id dos comentários no arquivo .json BD
                                        addUltimoCommentIdUser(task.user, commentId, config) // add ao arquivo .json na camada de user ultima mensagem enviada do clickup ao whatsapp
                                        addCommentIdUser(task.user, mensagemArquivoEnviada._data.id.id, commentId, config)
                                        deletarArquivo(pathArquivo)
                                        await removeTagTarefa(body.task_id, config)
                                        // limpar registros de mensagens que expiraram(passaram de 1 hora no registro)
                                        let msgs = getCommentsTarefa(body.task_id, config)
                                        for (var msg of Object.entries(msgs)) {
                                            if (!validateTimeDeleteMessageWhatsapp(msg[1].timestamp)) deleteCommentIdTarefa(body.task_id, msg[0], config)
                                        }
                                        arquivoEnviado = true
                                        //									return res.status(200).json({ retorno: { status: 'OK' } })
                                    }
                                }
                            } else {
                                mensagem += comment.text.replace('==', '').replace('--', '').replace('\n✓', '').replace('\n✓✓', '').replace('\n✕', '') // enviar msg interno e externa							
                            }
                        }
                        if (!arquivoEnviado) {
                            mensagem = ((msgLiberadaSemUser.length == 0 ? `*${body.history_items[0].comment.user.username.split(' ')[0]}:*\n` : "") + mensagem)
                        }
                        let mensagemEnviada = await client.sendMessage(task.user, mensagem.replace('**', '*').replace('**', '*'))
                        addCommentIdTarefa(body.task_id, commentId, mensagemEnviada._data.id.id, mensagemEnviada.timestamp, config) // add id dos comentários no arquivo .json BD
                        addUltimoCommentIdUser(task.user, commentId, config) // add ao arquivo .json na camada de user ultima mensagem enviada do clickup ao whatsapp								
                        addCommentIdUser(task.user, mensagemEnviada._data.id.id, commentId, config)
                        await removeTagTarefa(body.task_id, config)
                        // limpar registros de mensagens que expiraram(passaram de 1 hora no registro)
                        let msgs = getCommentsTarefa(body.task_id, config)
                        for (var msg of Object.entries(msgs)) {
                            if (!validateTimeDeleteMessageWhatsapp(msg[1].timestamp)) deleteCommentIdTarefa(body.task_id, msg[0], config)
                        }
                    }
                }
            }
            return res.status(200).json({ retorno: { status: 'OK' } })
        } catch (erro) {
            try {
                createLogErroWhatsapp('whatsapp', erro, { taskId: body.task_id, comment: body.history_items[0].comment })
                let resultWebhook = await getStatusWebhook(config)
                if (resultWebhook.status != "active") await atualizarWebhook(resultWebhook, config)
                client.destroy()
                client.initialize()
                console.log(erro, "=>", dataHotaAtual())
                await client.sendMessage(config.TELEFONE_NOTIFICACAO, `*** ATENÇÃO: MSG DO SISTEMA ***\nHouve um erro ao enviar a mensagem\n*MENSAGEM DE ERRO:* \n${erro}`)
                await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nHouve um erro ao enviar a mensagem. Tente novamente e se o erro persistir, notifique o Administrador.(Exception 1)", config, "Integração:\n")
                return res.status(200).json({ retorno: { status: 'ERRO' } })
            } catch (erro) {
                createLogErroWhatsapp('whatsapp', erro, { taskId: body.task_id, comment: body.history_items[0].comment })
                let resultWebhook = await getStatusWebhook(config)
                if (resultWebhook.status != "active") await atualizarWebhook(resultWebhook, config)
                console.log(erro, "=>", dataHotaAtual())
                await enviarMensagem(body.task_id, "*** ATENÇÃO: MSG DO SISTEMA ***\nHouve um erro ao enviar a mensagem. Tente novamente e se o erro persistir, notifique o Administrador.(Exception 2)", config, "Integração:\n")
                return res.status(200).json({ retorno: { status: 'ERRO' } })
            }
        }
    }
}

function absolutePath() { return __dirname.replace('\\utils', '').replace('/utils', '') }
