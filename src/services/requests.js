const axios = require("axios");
const fs = require('fs');
const FormData = require('form-data');
const BASE_URL = "https://api.clickup.com/api/v2"
const BASE_URL_TINY = "https://api.tiny.com.br/api2/"
const TOKEN_AP = "fd30870b2c0178cbc92a9e89c84dc8ec5940dafc"
const TOKEN_GS = "a50d8d523387613b9dc9d4f3939dfa9d08402fe0"
const TOKEN_MS = "f28765c7eeee88abc8df51a9f0213c85b53cb77b"

module.exports = {
    criarTarefa: async (config, nome, descricao, telefone) => {
        try {
            let options = {
                method: "post",
                url: `${ BASE_URL }/list/${config.ID_LISTA_CLIENTES}/task`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: { name: nome, description: descricao, tags: ["nova mensagem"], "check_required_custom_fields": true, custom_fields: [{ id: "7810cc42-ad7f-4e81-a135-8788c51ac2d6", value: telefone }]  }
            }                                                                                                                                    
            let response = await axios(options)
            console.log('tarefa criada...')
            return { taskId: response.data.id, configTask: { user: "" } }
        } catch (err) {
            console.log(err.response.data)
            return { erro: err }
        }
    },
    enviarMensagem: async (taskId, msg, config, user = false ) => {
        try {
            let body = !user ? { comment_text: msg, notify_all: true } : { comment: [{ text: user, attributes: { bold: true } }, { text: msg }] }
            let options = {
                method: "post",
                url: `${ BASE_URL }/task/${taskId}/comment`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: body
            }
            let response = await axios(options)
            // console.log('mensagem obtida...')
            //            console.log(response.data) // Dados da mensagem obtida
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    atualizarMensagem: async (commentId, msg, config) => {
        try {
            let options = {
                method: "put",
                url: `${ BASE_URL }/comment/${commentId}`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: { comment_text: msg, notify_all: true }
            }
            let response = await axios(options)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    atualizarTask: async (taskId, body, config) => {
        try {
            let options = {
                method: "put",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: body
            }
            let response = await axios(options)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    criarCustomFields: async (taskId, fieldId, value, config) => {
        try {
            let options = {
                method: "post",
                url: `${ BASE_URL }/task/${taskId}/field/${fieldId}/?custom_task_ids=true`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: { value }
            }
            let response = await axios(options)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getMessageLista: async (config) => { // ajustar oparametro trocado listId para config
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/list/${config.ID_LISTA_CLIENTES}/comment`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('mensagem obtida...')
            //            console.log(response.data) // Dados da mensagem obtida
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getMessageTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/task/${taskId}/comment`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('mensagem obtida...')
            //    console.log(response.data.comments.map(item=>console.log(item))) // Dados da mensagem obtida
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getAttachmentsTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('Arquivos obtidos...')
            //            console.log(response.data)
            return response.data.attachments
        } catch (err) {
            return { erro: err }
        }
    },
    getCamposExtraTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('Campos obtidos...')
            //            console.log(response.data)
            return response.data.custom_fields
        } catch (err) {
            return { erro: err }
        }
    },
    getTarefas: async (config) => { // ajusatr parametro
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/list/${config.ID_LISTA_CLIENTES}/task`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('mensagem obtida...')
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    atualizarStatusTarefa: async (tarefa, taskId, newStatus, config) => {
        try {
            tarefa.status = newStatus
            let options = {
                method: "put",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: tarefa
            }
            let response = await axios(options)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getNomeTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/task/${taskId}`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            //            console.log('nome datarefa obtido...')
            //            console.log(response.data)
            return { taskName: response.data.name }
        } catch (err) {
            return { erro: err }
        }
    },
    postAttachmentTarefa: async (taskId, pathArquivo, config) => {
        try {
            let formData = new FormData()
            formData.append('attachment', fs.createReadStream(pathArquivo))
            let options = {
                method: "post",
                url: `${ BASE_URL }/task/${taskId}/attachment`,
                headers: {
                    "Authorization": config.TOKEN,
                    "Content-Type": "multipart/form-data"
                },
                data: formData
            }
            let response = await axios(options)
            console.log('Arquivos enviado...')
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }

    },
    addTagTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "post",
                url: `${ BASE_URL }/task/${taskId}/tag/nova mensagem`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('tag adicionada...', { taskId })
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    removeTagTarefa: async (taskId, config) => {
        try {
            let options = {
                method: "delete",
                url: `${ BASE_URL }/task/${taskId}/tag/nova mensagem`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            console.log('tag removida...', { taskId })
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    getStatusWebhook: async (config) => {
        try {
            let options = {
                method: "get",
                url: `${ BASE_URL }/team/${config.ID_TEAM_CLICKUP}/webhook`,
                headers: {
                    "Authorization": config.TOKEN
                }
            }
            let response = await axios(options)
            //            console.log('status webhook obtido...')
            //            console.log(response.data.webhooks)
            return { id: response.data.webhooks[0].id, status: response.data.webhooks[0].health.status, events: response.data.webhooks[0].events, endpoint: response.data.webhooks[0].endpoint }
        } catch (err) {
            return { erro: err }
        }
    },
    createWebhook: async (config, idCliente) => {
        try {
            let options = {
                method: "post",
                url: `${ BASE_URL }/team/${config.idTeam}/webhook`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: { endpoint: `http://89.117.55.232:3000/message?idCliente=${ idCliente }`, events: [ "taskCommentPosted" ] }
            }
            let response = await axios(options)
            return { id: response.data.webhooks[0].id, status: response.data.webhooks[0].health.status, events: response.data.webhooks[0].events, endpoint: response.data.webhooks[0].endpoint }
        } catch (err) {
            return { erro: err }
        }
    },
    atualizarWebhook: async (dadosAtualizacao, config) => {
        try {
            let options = {
                method: "put",
                url: `${ BASE_URL }/webhook/${dadosAtualizacao.id}`,
                headers: {
                    "Authorization": config.TOKEN
                },
                data: {
                    endpoint: dadosAtualizacao.endpoint,
                    events: dadosAtualizacao.events,
                    status: "active"
                }
            }
            let response = await axios(options)
            console.log('webhook atualizado...')
            //            console.log(response.data)
            return response.data
        } catch (err) {
            return { erro: err }
        }
    },
    Tiny: {
        atualizarStatusPedido: async (loja, idPedido, config) => {
            try {
                const token = {
                    "AP": TOKEN_AP,
                    "GS": TOKEN_GS,
                    "MS": TOKEN_MS
                }
                let options = {
                    method: "post",
                    url: `${BASE_URL_TINY}pedido.alterar.situacao?token=${token[loja]}&formato=json&situacao=Aprovado&id=${idPedido}`,
                }
                let response = await axios(options)
                console.log('status do atualizado...')
                return response.data
            } catch (err) {
                return { erro: err }
            }
        },
        incluirMarcadorPedido: async (loja, idPedido, config) => {
            try {
                const token = {
                    "AP": TOKEN_AP,
                    "GS": TOKEN_GS,
                    "MS": TOKEN_MS
                }
                let options = {
                    method: "post",
                    url: `${BASE_URL_TINY}pedido.marcadores.incluir?token=${token[loja]}&formato=json&idPedido=${idPedido}`,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    data: `marcadores={marcadores: [{"marcador": {"descricao": "-Tratado"}}]}`
                }
                let response = await axios(options)
                console.log('Incluído marcador no pedido...')
                return response.data
            } catch (err) {
                return { erro: err }
            }
        }
    }
}