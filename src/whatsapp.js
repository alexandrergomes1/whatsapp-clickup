const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const qrimage = require('qr-image');
const fs = require(`fs`);
const { clienteConfigSet, configGetCliente, deletarArquivo } = require("./utils/utils");
const { confirmMessage, sendMessage } = require('./utils/utilsWhatsapp')

const session = async function (idCliente) {
 
    const client = new Client({
        // restartOnAuthFail: true,
        puppeteer: { executablePath: "/usr/bin/chromium" },
        authStrategy: new LocalAuth({
            clientId: idCliente
        })
    });
    console.log('iniciando o cliente ' + idCliente)

    client.initialize()
    clienteConfigSet(idCliente, { tipo: "inicializado", value: true })
    clienteConfigSet(idCliente, { tipo: "falha", value: false })

    client.on(`qr`, async (qr) => {
        // qrcode.generate(qr, { small: true });
        let timestamp = Number(new Date())
        let qr_svg = qrimage.image(qr, { type: 'svg' });
        qr_svg.pipe(fs.createWriteStream(`${__dirname}/pages/assets/qr-code-${ idCliente }-${ timestamp }.svg`))

        let configCliente = configGetCliente(idCliente) 
        deletarArquivo(`${__dirname}/pages/assets/${ configCliente.nome_qrcode }.svg`) 
        clienteConfigSet( idCliente, { tipo: "nome_qrcode", value: `qr-code-${ idCliente }-${ timestamp }` })
    });

    client.on(`authenticated`, (session) => {
        console.log(`Cliente [ ${ idCliente } ] autenticado.`)
        clienteConfigSet(idCliente, { tipo: "autenticado", value: true })
        let configCliente = configGetCliente(idCliente) 
        deletarArquivo(`${__dirname}/pages/assets/${ configCliente.nome_qrcode }.svg`)
    });

    client.on(`auth_failure`, (msg) => {
        console.log(`Houve uma falha com o cliente ${ idCliente }.\n[ MSG ] = auth_failure =>`, msg);
        clienteConfigSet(idCliente, { tipo: "falha", value: true })
    });

    client.on(`ready`, () => {
        console.log(`Cliente [ ${ idCliente } ] preparado para uso.`);
    });

    client.on(`disconnected`, (reason) => {
        console.log(`disconnected`, reason);
        client.destroy();
        client.initialize();
        clienteConfigSet(idCliente, { tipo: "autenticado", value: false })
    });

    client.on('message_ack', async (msg, ack) => {
        let configCliente = configGetCliente(msg.to.replace('@c.us', ''))
        await confirmMessage(msg, ack, configCliente)
    })
    
    client.on(`message`, async msg => {
        if (msg.from == "status@broadcast" || msg.type == "e2e_notification" || msg.type == "protocol") return true
        let configCliente = configGetCliente(msg.to.replace('@c.us', '').slice(2)) 
        console.log('\n\nmessage de ' + msg.from + ' para ' + msg.to + ' com a msg => ' + msg.body + '\n\n', configCliente)
        await sendMessage(client, msg, configCliente)
    });

    return client;
};


module.exports = session
