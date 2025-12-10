import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
const host = "0.0.0.0";
const porta = 3000;

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "segredo_do_sistema",
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 30 * 60 * 1000 }
}));


var listaEquipes = [];
var listaJogadores = [];


function verificarLogin(req, res, next) {
    if (req.session.usuarioLogado) {
        next();
    } else {
        res.redirect("/login");
    }
}


app.get("/login", (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Login</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Login do Sistema</h1>
            <form method="POST">
                Usuário: <input type="text" name="usuario"><br><br>
                Senha: <input type="password" name="senha"><br><br>
                <button type="submit">Entrar</button>
            </form>
        </body>
        </html>
    `);
});

app.post("/login", (req, res) => {
    const usuario = req.body.usuario;
    const senha = req.body.senha;

    if (usuario === "admin" && senha === "123") {
        req.session.usuarioLogado = true;

        
        res.cookie("ultimoAcesso", new Date().toLocaleString(), { maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.redirect("/menu");
    } else {
        res.send(`
            <html><body>
                <h1>Login inválido</h1>
                <a href="/login">Tentar novamente</a>
            </body></html>
        `);
    }
});


app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});


app.get("/menu", verificarLogin, (req, res) => {
    const ultimo = req.cookies.ultimoAcesso || "Primeiro acesso";

    res.send(`
        <html>
        <head><meta charset="utf-8"><title>Menu</title></head>
        <body>
            <h1>Menu do Sistema</h1>
            <p>Último acesso: ${ultimo}</p>
            <ul>
                <li><a href="/cadastroEquipe">Cadastro de Equipes</a></li>
                <li><a href="/cadastroJogador">Cadastro de Jogadores</a></li>
                <li><a href="/logout">Logout</a></li>
            </ul>
        </body>
        </html>
    `);
});



app.get("/cadastroEquipe", verificarLogin, (req, res) => {
    res.send(`
        <html>
        <head><meta charset="utf-8"><title>Cadastro Equipe</title></head>
        <body>
            <h1>Cadastro de Equipes</h1>
            <form method="POST">
                Nome da equipe: <input type="text" name="nome"><br><br>
                Capitão: <input type="text" name="capitao"><br><br>
                Telefone/WhatsApp: <input type="text" name="contato"><br><br>
                <button type="submit">Cadastrar</button>
            </form>
            <br>
            <a href="/menu">Voltar ao menu</a>
        </body>
        </html>
    `);
});

app.post("/cadastroEquipe", verificarLogin, (req, res) => {
    const { nome, capitao, contato } = req.body;

    if (!nome || !capitao || !contato) {
        res.send(`
            <html><body>
                <h1>Erro: Todos os campos são obrigatórios.</h1>
                <a href="/cadastroEquipe">Voltar</a>
            </body></html>
        `);
        return;
    }

    listaEquipes.push({ nome, capitao, contato });

    let lista = "<ul>";
    for (let eq of listaEquipes) {
        lista += `<li>${eq.nome} — Capitão: ${eq.capitao} — Contato: ${eq.contato}</li>`;
    }
    lista += "</ul>";

    res.send(`
        <html><body>
            <h1>Equipe cadastrada com sucesso!</h1>
            ${lista}
            <br><a href="/cadastroEquipe">Cadastrar outra equipe</a><br>
            <a href="/menu">Menu</a>
        </body></html>
    `);
});



app.get("/cadastroJogador", verificarLogin, (req, res) => {

    if (listaEquipes.length === 0) {
        res.send(`
            <html><body>
                <h1>Não há equipes cadastradas!</h1>
                <a href="/cadastroEquipe">Cadastrar equipe</a>
            </body></html>
        `);
        return;
    }

    let opcoes = "";
    for (let eq of listaEquipes) {
        opcoes += `<option value="${eq.nome}">${eq.nome}</option>`;
    }

    res.send(`
        <html>
        <head><meta charset="utf-8"><title>Cadastro Jogador</title></head>
        <body>
            <h1>Cadastro de Jogadores</h1>
            <form method="POST">
                Nome: <input type="text" name="nome"><br><br>
                Nickname: <input type="text" name="nick"><br><br>
                Função: 
                <select name="funcao">
                    <option>top</option>
                    <option>jungle</option>
                    <option>mid</option>
                    <option>atirador</option>
                    <option>suporte</option>
                </select><br><br>
                Elo: <input type="text" name="elo"><br><br>
                Gênero: <input type="text" name="genero"><br><br>
                Equipe: 
                <select name="equipe">
                    ${opcoes}
                </select><br><br>

                <button type="submit">Cadastrar</button>
            </form>
            <br>
            <a href="/menu">Voltar ao menu</a>
        </body>
        </html>
    `);
});

app.post("/cadastroJogador", verificarLogin, (req, res) => {
    const { nome, nick, funcao, elo, genero, equipe } = req.body;

    if (!nome || !nick || !funcao || !elo || !genero || !equipe) {
        res.send(`
            <html><body>
                <h1>Erro: Todos os campos são obrigatórios.</h1>
                <a href="/cadastroJogador">Voltar</a>
            </body></html>
        `);
        return;
    }

   
    const jogadoresDaEquipe = listaJogadores.filter(j => j.equipe === equipe);
    if (jogadoresDaEquipe.length >= 5) {
        res.send(`
            <html><body>
                <h1>Erro: Esta equipe já possui 5 jogadores!</h1>
                <a href="/cadastroJogador">Voltar</a>
            </body></html>
        `);
        return;
    }

    listaJogadores.push({ nome, nick, funcao, elo, genero, equipe });

    
    let html = "<h1>Jogadores Cadastrados</h1>";

    for (let eq of listaEquipes) {
        html += `<h2>Equipe: ${eq.nome}</h2><ul>`;
        for (let jog of listaJogadores) {
            if (jog.equipe === eq.nome) {
                html += `<li>${jog.nome} (${jog.nick}) — ${jog.funcao}, ${jog.elo}, ${jog.genero}</li>`;
            }
        }
        html += "</ul>";
    }

    res.send(`
        <html><body>
            ${html}
            <br><a href="/cadastroJogador">Cadastrar outro jogador</a><br>
            <a href="/menu">Menu</a>
        </body></html>
    `);
});



app.listen(porta, host, () => {
    console.log("Servidor rodando em http://" + host + ":" + porta);
});