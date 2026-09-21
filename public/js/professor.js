/* =========================================================
   EDUCLASS — PAINEL DO PROFESSOR
   JAVASCRIPT CORRIGIDO
========================================================= */

let currentCalendarDate = new Date();
let eventosEscolares = [];

const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

/* =========================================================
   CALENDÁRIO
========================================================= */

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthTitle = document.getElementById("calendarMonth");
    const calendarDays = document.getElementById("calendarDays");

    if (!monthTitle || !calendarDays) {
        return;
    }

    monthTitle.textContent = `${meses[month]} ${year}`;
    calendarDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day empty";
        calendarDays.appendChild(emptyDay);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "calendar-day";

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            dayElement.classList.add("today");
        }

        const hasEvent = eventosEscolares.some(evento => {
            const eventDate = parseEventDate(evento.data_evento);

            if (!eventDate) {
                return false;
            }

            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
            );
        });

        if (hasEvent) {
            dayElement.classList.add("event");
            dayElement.classList.add("has-event");
        }

        dayElement.innerHTML = `
            <span>${day}</span>
            ${hasEvent ? "<i></i>" : ""}
        `;

        calendarDays.appendChild(dayElement);
    }
}

function parseEventDate(dateValue) {
    if (!dateValue) {
        return null;
    }

    if (dateValue instanceof Date) {
        return dateValue;
    }

    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        const parts = dateValue.split("-");

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

/* =========================================================
   PRÓXIMO EVENTO
========================================================= */

function mostrarProximoEvento() {
    const title = document.getElementById("nextEventTitle");
    const dateElement = document.getElementById("nextEventDate");

    if (!title || !dateElement) {
        return;
    }

    const agora = new Date();

    const eventosFuturos = eventosEscolares
        .map(evento => {
            const data = parseEventDate(evento.data_evento);

            return {
                ...evento,
                dataConvertida: data
            };
        })
        .filter(evento => {
            return (
                evento.dataConvertida &&
                evento.dataConvertida >= agora
            );
        })
        .sort((a, b) => {
            return a.dataConvertida - b.dataConvertida;
        });

    if (eventosFuturos.length === 0) {
        title.textContent = "Nenhum próximo evento";
        dateElement.textContent = "Sua agenda está livre.";
        return;
    }

    const proximo = eventosFuturos[0];

    title.textContent = proximo.titulo || "Evento escolar";

    dateElement.textContent = `📅 ${proximo.dataConvertida.toLocaleDateString(
        "pt-BR"
    )}`;
}

/* =========================================================
   CARREGAR EVENTOS
========================================================= */

async function carregarEventosDaDirecao() {
    try {
        const response = await fetch("/listar-eventos");

        if (!response.ok) {
            throw new Error("Erro ao carregar eventos.");
        }

        const eventos = await response.json();

        eventosEscolares = Array.isArray(eventos) ? eventos : [];

        renderCalendar();
        mostrarProximoEvento();

    } catch (error) {
        console.error("Erro nos eventos:", error);

        eventosEscolares = [];

        renderCalendar();

        const title = document.getElementById("nextEventTitle");
        const date = document.getElementById("nextEventDate");

        if (title) {
            title.textContent = "Nenhum evento encontrado";
        }

        if (date) {
            date.textContent = "Não foi possível carregar a agenda.";
        }
    }
}

/* =========================================================
   COMUNICADOS
========================================================= */

async function carregarRecadosDaDirecao() {
    const mural = document.getElementById("muralDirecao");

    if (!mural) {
        return;
    }

    try {
        const response = await fetch("/listar-recados");

        if (!response.ok) {
            throw new Error("Erro ao carregar comunicados.");
        }

        const recados = await response.json();

        if (!Array.isArray(recados) || recados.length === 0) {
            mural.innerHTML = `
                <div class="empty-card">
                    <span>📭</span>
                    <p>Nenhum comunicado oficial recente.</p>
                </div>
            `;

            return;
        }

        mural.innerHTML = recados.map(recado => `
            <div class="communication-item">
                <div class="communication-icon">
                    <i class="fa-solid fa-bullhorn"></i>
                </div>

                <div class="communication-content">
                    <div class="communication-title">
                        ${escapeHTML(recado.titulo || "Comunicado")}
                    </div>

                    <div class="communication-text">
                        ${escapeHTML(recado.conteudo || "")}
                    </div>

                    <div class="communication-date">
                        Enviado por:
                        ${escapeHTML(recado.autor || "Coordenação")}
                    </div>
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.error("Erro nos comunicados:", error);

        mural.innerHTML = `
            <div class="empty-card">
                <span>⚠️</span>
                <p>Não foi possível carregar os comunicados.</p>
            </div>
        `;
    }
}

/* =========================================================
   PLANEJAMENTOS
========================================================= */

async function carregarPlanejamentos() {
    const lista = document.getElementById("listaPlanejamentos");
    const contador = document.getElementById("planningCount");

    if (!lista) {
        return;
    }

    try {
        const response = await fetch("/listar-planejamentos");

        if (!response.ok) {
            throw new Error("Erro ao carregar planejamentos.");
        }

        const dados = await response.json();

        const planejamentos = Array.isArray(dados) ? dados : [];

        if (contador) {
            contador.textContent = planejamentos.length;
        }

        if (planejamentos.length === 0) {
            lista.innerHTML = `
                <div class="empty-card">
                    <span>📝</span>
                    <p>Você ainda não possui planejamentos salvos.</p>
                </div>
            `;

            return;
        }

        lista.innerHTML = planejamentos.map(planejamento => `
            <article class="saved-planning">
                <div class="planning-top">
                    <span class="planning-subject">
                        ${escapeHTML(planejamento.materia || "Sem matéria")}
                    </span>

                    <span class="planning-date">
                        📅 ${formatDate(planejamento.data_planejada)}
                    </span>
                </div>

                <h3>Planejamento de aula</h3>

                <p>
                    ${escapeHTML(planejamento.conteudo || "")}
                </p>

                <button
                    type="button"
                    onclick="apagarPlanejamento(${Number(planejamento.id)})"
                    class="delete-planning"
                >
                    Excluir planejamento
                </button>
            </article>
        `).join("");

    } catch (error) {
        console.error("Erro nos planejamentos:", error);

        lista.innerHTML = `
            <div class="empty-card">
                <span>⚠️</span>
                <p>Erro ao carregar planejamentos.</p>
            </div>
        `;
    }
}

/* =========================================================
   SALVAR PLANEJAMENTO
========================================================= */

async function configurarFormularioPlanejamento() {
    const formPlanejamento =
        document.getElementById("formPlanejamento");

    if (!formPlanejamento) {
        return;
    }

    formPlanejamento.addEventListener("submit", async function (event) {
        event.preventDefault();

        const botao = this.querySelector("button[type='submit']");

        const dados = new URLSearchParams(
            new FormData(this)
        );

        try {
            if (botao) {
                botao.disabled = true;
                botao.textContent = "SALVANDO...";
            }

            const response = await fetch("/criar-planejamento", {
                method: "POST",
                body: dados
            });

            if (!response.ok) {
                throw new Error("Não foi possível salvar.");
            }

            this.reset();

            await carregarPlanejamentos();

            if (botao) {
                botao.disabled = false;
                botao.textContent = "+ SALVAR PLANEJAMENTO";
            }

            mostrarMensagem(
                "Planejamento salvo com sucesso!",
                "success"
            );

        } catch (error) {
            console.error(error);

            if (botao) {
                botao.disabled = false;
                botao.textContent = "+ SALVAR PLANEJAMENTO";
            }

            mostrarMensagem(
                "Erro ao salvar o planejamento.",
                "error"
            );
        }
    });
}

/* =========================================================
   APAGAR PLANEJAMENTO
========================================================= */

async function apagarPlanejamento(id) {
    const confirmar = confirm(
        "Deseja realmente excluir este planejamento?"
    );

    if (!confirmar) {
        return;
    }

    try {
        const response = await fetch(
            `/apagar-planejamento/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao excluir.");
        }

        await carregarPlanejamentos();

        mostrarMensagem(
            "Planejamento excluído.",
            "success"
        );

    } catch (error) {
        console.error(error);

        mostrarMensagem(
            "Não foi possível excluir o planejamento.",
            "error"
        );
    }
}

/* =========================================================
   FORMATAÇÃO E SEGURANÇA
========================================================= */

function formatDate(dateValue) {
    if (!dateValue) {
        return "—";
    }

    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        const parts = dateValue.split("-");

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString("pt-BR");
}

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function mostrarMensagem(mensagem, tipo) {
    const antiga = document.querySelector(".system-message");

    if (antiga) {
        antiga.remove();
    }

    const elemento = document.createElement("div");

    elemento.className = `system-message ${tipo}`;
    elemento.textContent = mensagem;

    document.body.appendChild(elemento);

    setTimeout(() => {
        elemento.classList.add("hide");

        setTimeout(() => {
            elemento.remove();
        }, 300);
    }, 3000);
}

/* =========================================================
   NAVEGAÇÃO DAS PÁGINAS
========================================================= */

function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll(
        ".menu-item[data-page]"
    );

    const paginas = document.querySelectorAll(
        ".page-section"
    );

    const tituloPagina = document.getElementById("pageTitle");

    const titulos = {
        inicio: "Dashboard",
        turmas: "Minhas turmas",
        notas: "Notas",
        frequencia: "Frequência",
        planejamento: "Planejamento",
        calendario: "Calendário",
        comunicados: "Comunicados",
        mensagens: "Mensagens",
        configuracoes: "Configurações"
    };

    function mostrarPagina(nomePagina) {
        paginas.forEach(pagina => {
            pagina.style.display = "none";
        });

        const paginaSelecionada =
            document.getElementById(nomePagina);

        if (paginaSelecionada) {
            paginaSelecionada.style.display = "block";
        }

        if (tituloPagina) {
            tituloPagina.textContent =
                titulos[nomePagina] || "EduClass";
        }

        botoesMenu.forEach(botao => {
            botao.classList.remove("active");

            if (
                botao.getAttribute("data-page") === nomePagina
            ) {
                botao.classList.add("active");
            }
        });

        fecharMenuMobile();
    }

    botoesMenu.forEach(botao => {
        botao.addEventListener("click", event => {
            event.preventDefault();

            const pagina =
                botao.getAttribute("data-page");

            mostrarPagina(pagina);
        });
    });

    document.querySelectorAll("[data-go-page]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const pagina =
                link.getAttribute("data-go-page");

            mostrarPagina(pagina);
        });
    });

    mostrarPagina("inicio");
}

/* =========================================================
   MENU LATERAL
========================================================= */

function configurarMenuLateral() {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar || !menuToggle) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle("mobile-open");

            if (overlay) {
                overlay.classList.toggle("active");
            }

        } else {
            sidebar.classList.toggle("collapsed");
        }
    });

    if (overlay) {
        overlay.addEventListener("click", fecharMenuMobile);
    }
}

function fecharMenuMobile() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove("mobile-open");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }
}

/* =========================================================
   DATA ATUAL
========================================================= */

function mostrarDataAtual() {
    const elemento = document.getElementById("currentDate");

    if (!elemento) {
        return;
    }

    const dataAtual = new Date();

    elemento.textContent = dataAtual.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

/* =========================================================
   BOTÕES DO CALENDÁRIO
========================================================= */

function configurarCalendario() {
    const previousMonth =
        document.getElementById("prevMonth");

    const nextMonth =
        document.getElementById("nextMonth");

    const currentMonthButton =
        document.getElementById("currentMonthButton");

    if (previousMonth) {
        previousMonth.addEventListener("click", () => {
            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() - 1
            );

            renderCalendar();
        });
    }

    if (nextMonth) {
        nextMonth.addEventListener("click", () => {
            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() + 1
            );

            renderCalendar();
        });
    }

    if (currentMonthButton) {
        currentMonthButton.addEventListener("click", () => {
            currentCalendarDate = new Date();

            renderCalendar();
        });
    }
}

/* =========================================================
   MINHAS TURMAS — ALUNOS CADASTRADOS PELA GESTÃO
========================================================= */

let alunosCadastrados = [];

async function carregarAlunosDasTurmas() {
    try {
        const response = await fetch("/listar-alunos");

        if (!response.ok) {
            throw new Error("Erro ao carregar alunos.");
        }

        const dados = await response.json();

        alunosCadastrados =
            Array.isArray(dados) ? dados : [];

        organizarTurmas();

        carregarTurmasNotas();

    } catch (error) {
        console.error(
            "Erro ao carregar alunos das turmas:",
            error
        );
    }
}

function organizarTurmas() {
    const listaTurmas =
        document.getElementById("listaTurmas");

    if (!listaTurmas) {
        return;
    }

    const turmas = {};

    alunosCadastrados.forEach(aluno => {
        const nomeTurma =
            aluno.turma || "Turma não informada";

        if (!turmas[nomeTurma]) {
            turmas[nomeTurma] = [];
        }

        turmas[nomeTurma].push(aluno);
    });

    const nomesDasTurmas =
        Object.keys(turmas);

    if (nomesDasTurmas.length === 0) {
        listaTurmas.innerHTML = `
            <div class="empty-card">
                <span>🎓</span>
                <p>
                    Nenhum aluno foi cadastrado
                    pela Gestão ainda.
                </p>
            </div>
        `;

        return;
    }

    listaTurmas.innerHTML =
        nomesDasTurmas.map((nomeTurma, index) => {

            const idTurma =
                `turma-${index}`;

            return `
                <div class="card">

                    <div class="card-icon">
                        <i class="fa-solid fa-users"></i>
                    </div>

                    <h3>
                        ${escapeHTML(nomeTurma)}
                    </h3>

                    <p>
                        ${turmas[nomeTurma].length}
                        aluno(s) cadastrado(s)
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="mostrarAlunos('${idTurma}')"
                    >
                        Ver alunos
                    </button>

                </div>
            `;

        }).join("");

    window.turmasOrganizadas = {};

    nomesDasTurmas.forEach((nomeTurma, index) => {

        window.turmasOrganizadas[
            `turma-${index}`
        ] = {
            nome: nomeTurma,
            alunos: turmas[nomeTurma]
        };

    });
}

/* =========================================================
   TURMAS DA ÁREA DE NOTAS
========================================================= */

function carregarTurmasNotas() {

    const select = document.getElementById("turmaNotas");

    if (!select) {

        return;

    }

    const turmas = [

        ...new Set(

            alunosCadastrados

                .map(aluno => aluno.turma)

                .filter(turma => turma)

        )

    ];

    select.innerHTML = `

        <option value="">

            Selecione uma turma

        </option>

    `;

    turmas.forEach(turma => {

        const option = document.createElement("option");

        option.value = turma;

        option.textContent = turma;

        select.appendChild(option);

    });

    /* Quando selecionar uma turma, mostrar os alunos */

    select.addEventListener("change", function () {

        const turmaSelecionada = this.value;

        const lista =

            document.getElementById("listaNotas");

        if (!lista) {

            return;

        }

        if (!turmaSelecionada) {

            lista.innerHTML = `

                <div class="empty-card">

                    <span>🎓</span>

                    <p>

                        Selecione uma turma para visualizar os alunos.

                    </p>

                </div>

            `;

            return;

        }

        const alunosDaTurma =

            alunosCadastrados.filter(aluno =>

                aluno.turma === turmaSelecionada

            );

        if (alunosDaTurma.length === 0) {

            lista.innerHTML = `

                <div class="empty-card">

                    <span>👥</span>

                    <p>

                        Nenhum aluno encontrado nessa turma.

                    </p>

                </div>

            `;

            return;

        }

        lista.innerHTML = alunosDaTurma.map(aluno => `

            <div class="nota-aluno">

                <div class="aluno-info">

                    <strong>

                        ${escapeHTML(aluno.nome)}

                    </strong>

                    <span>

                        ${escapeHTML(aluno.turma)}

                    </span>

                </div>

                <div class="nota-input">

                    <label>

                        Nota

                    </label>

                    <input

                        type="number"

                        min="0"

                        max="10"

                        step="0.1"

                        class="campo-nota"

                        data-aluno-id="${aluno.id}"

                        data-aluno-nome="${escapeHTML(aluno.nome)}"

                        placeholder="0,0"

                    >

                </div>

            </div>

       `).join("");

        // Botão para salvar as notas

        const botaoSalvar = document.createElement("button");

        botaoSalvar.type = "button";

        botaoSalvar.className = "btn btn-primary";

        botaoSalvar.textContent = "Salvar notas";

        botaoSalvar.style.marginTop = "20px";

        botaoSalvar.style.padding = "12px 20px";

        botaoSalvar.style.border = "none";

        botaoSalvar.style.borderRadius = "8px";

        botaoSalvar.style.cursor = "pointer";

        lista.appendChild(botaoSalvar);

        botaoSalvar.addEventListener("click", async () => {

            const campos =

                lista.querySelectorAll(".campo-nota");

            const notas = [];

            campos.forEach(campo => {

                if (campo.value !== "") {

                    notas.push({

                        aluno_id: campo.dataset.alunoId,

                        aluno_nome: campo.dataset.alunoNome,

                        turma: turmaSelecionada,

                        nota: Number(campo.value)

                    });

                }

            });

            if (notas.length === 0) {

                mostrarMensagem(

                    "Digite pelo menos uma nota.",

                    "error"

                );

                return;

            }

            console.log("Notas para salvar:", notas);

            mostrarMensagem(

                "Notas preparadas para salvar!",

                "success"

            );

        });

    });

}

/* =========================================================
   MOSTRAR ALUNOS DA TURMA
========================================================= */

function mostrarAlunos(idTurma) {

    const turma =
        window.turmasOrganizadas?.[idTurma];

    const detalhes =
        document.getElementById("detalhesTurma");

    const titulo =
        document.getElementById("tituloDetalhesTurma");

    const lista =
        document.getElementById("listaAlunosTurma");

    if (
        !turma ||
        !detalhes ||
        !titulo ||
        !lista
    ) {
        return;
    }

    titulo.textContent =
        turma.nome;

    lista.innerHTML =
        turma.alunos.map((aluno, index) => {

            return `
                <div class="communication-item">

                    <div class="communication-icon">
                        <i class="fa-solid fa-user"></i>
                    </div>

                    <div class="communication-content">

                        <div class="communication-title">
                            ${index + 1}.
                            ${escapeHTML(aluno.nome)}
                        </div>

                        <div class="communication-text">
                            Aluno cadastrado pela Gestão
                        </div>

                    </div>

                </div>
            `;

        }).join("");

    detalhes.style.display =
        "block";
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    configurarNavegacao();

    configurarMenuLateral();

    configurarCalendario();

    configurarFormularioPlanejamento();

    mostrarDataAtual();

    renderCalendar();

    carregarEventosDaDirecao();

    carregarRecadosDaDirecao();

    carregarPlanejamentos();

    carregarAlunosDasTurmas();

});