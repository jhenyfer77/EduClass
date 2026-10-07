/* =========================================================

   EDUCLASS — PAINEL DO PROFESSOR

   JAVASCRIPT CORRIGIDO

========================================================= */

let currentCalendarDate = new Date();

let currentPageCalendarDate = new Date();

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

   CALENDÁRIO DO INÍCIO

========================================================= */

function renderCalendar() {

    const monthElement =

        document.getElementById("calendarMonth");

    const daysElement =

        document.getElementById("calendarDays");

    if (!monthElement || !daysElement) {

        return;

    }

    const ano = currentCalendarDate.getFullYear();

    const mes = currentCalendarDate.getMonth();

    monthElement.textContent =

        `${meses[mes]} ${ano}`;

    const primeiroDia =

        new Date(ano, mes, 1).getDay();

    const ultimoDia =

        new Date(ano, mes + 1, 0).getDate();

    let html = "";

    for (let i = 0; i < primeiroDia; i++) {

        html += `

            <div class="calendar-day empty"></div>

        `;

    }

    for (let dia = 1; dia <= ultimoDia; dia++) {

        const dataAtual =

            `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const temEvento =

            eventosEscolares.some(evento => {

                return evento.data_evento === dataAtual;

            });

        html += `

            <div class="calendar-day ${temEvento ? "has-event" : ""}">

                <span>${dia}</span>

                ${

                    temEvento

                        ? `<i class="fa-solid fa-circle"></i>`

                        : ""

                }

            </div>

        `;

    }

    daysElement.innerHTML = html;

}

/* =========================================================

   CALENDÁRIO DA PÁGINA DO MENU

========================================================= */

function renderCalendarPage() {

    const monthElement =

        document.getElementById("calendarPageMonth");

    const daysElement =

        document.getElementById("calendarPageDays");

    if (!monthElement || !daysElement) {

        return;

    }

    const ano =

        currentPageCalendarDate.getFullYear();

    const mes =

        currentPageCalendarDate.getMonth();

    monthElement.textContent =

        `${meses[mes]} ${ano}`;

    const primeiroDia =

        new Date(ano, mes, 1).getDay();

    const ultimoDia =

        new Date(ano, mes + 1, 0).getDate();

    let html = "";

    for (let i = 0; i < primeiroDia; i++) {

        html += `

            <div class="calendar-day empty"></div>

        `;

    }

    for (let dia = 1; dia <= ultimoDia; dia++) {

        const dataAtual =

            `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const temEvento =

            eventosEscolares.some(evento => {

                return evento.data_evento === dataAtual;

            });

        html += `

            <div class="calendar-day ${temEvento ? "has-event" : ""}">

                <span>${dia}</span>

                ${

                    temEvento

                        ? `<i class="fa-solid fa-circle"></i>`

                        : ""

                }

            </div>

        `;

    }

    daysElement.innerHTML = html;

}

/* =========================================================

   PRÓXIMO EVENTO

========================================================= */

function mostrarProximoEvento() {

    const title =

        document.getElementById("nextEventTitle");

    const dateElement =

        document.getElementById("nextEventDate");

    const pageTitle =

        document.getElementById("nextEventPageTitle");

    const pageDate =

        document.getElementById("nextEventPageDate");

    const agora = new Date();

    const eventosFuturos =

        eventosEscolares

            .map(evento => {

                const data =

                    parseEventDate(evento.data_evento);

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

                return (

                    a.dataConvertida -

                    b.dataConvertida

                );

            });

    if (eventosFuturos.length === 0) {

        if (title) {

            title.textContent =

                "Nenhum próximo evento";

        }

        if (dateElement) {

            dateElement.textContent =

                "Sua agenda está livre.";

        }

        if (pageTitle) {

            pageTitle.textContent =

                "Nenhum próximo evento";

        }

        if (pageDate) {

            pageDate.textContent =

                "Sua agenda está livre.";

        }

        return;

    }

    const proximo =

        eventosFuturos[0];

    const textoTitulo =

        proximo.titulo ||

        "Evento escolar";

    const textoData =

        `📅 ${proximo.dataConvertida.toLocaleDateString("pt-BR")}`;

    if (title) {

        title.textContent =

            textoTitulo;

    }

    if (dateElement) {

        dateElement.textContent =

            textoData;

    }

    if (pageTitle) {

        pageTitle.textContent =

            textoTitulo;

    }

    if (pageDate) {

        pageDate.textContent =

            textoData;

    }

}

/* =========================================================

   CARREGAR EVENTOS

========================================================= */

async function carregarEventosDaDirecao() {

    try {

        const response =

            await fetch("/listar-eventos");

        if (!response.ok) {

            throw new Error(

                "Erro ao carregar eventos."

            );

        }

        const eventos =

            await response.json();

        eventosEscolares =

            Array.isArray(eventos)

                ? eventos

                : [];

        renderCalendar();

        renderCalendarPage();

        mostrarProximoEvento();

    } catch (error) {

        console.error(

            "Erro nos eventos:",

            error

        );

        eventosEscolares = [];

        renderCalendar();

        renderCalendarPage();

        const title =

            document.getElementById("nextEventTitle");

        const date =

            document.getElementById("nextEventDate");

        const pageTitle =

            document.getElementById("nextEventPageTitle");

        const pageDate =

            document.getElementById("nextEventPageDate");

        if (title) {

            title.textContent =

                "Nenhum evento encontrado";

        }

        if (date) {

            date.textContent =

                "Não foi possível carregar a agenda.";

        }

        if (pageTitle) {

            pageTitle.textContent =

                "Nenhum evento encontrado";

        }

        if (pageDate) {

            pageDate.textContent =

                "Não foi possível carregar a agenda.";

        }

    }

}

/* =========================================================

   COMUNICADOS

========================================================= */

async function carregarRecadosDaDirecao() {

    const mural =

        document.getElementById("muralDirecao");

    if (!mural) {

        return;

    }

    try {

        const response =

            await fetch("/listar-recados");

        if (!response.ok) {

            throw new Error(

                "Erro ao carregar comunicados."

            );

        }

        const recados =

            await response.json();

        if (

            !Array.isArray(recados) ||

            recados.length === 0

        ) {

            mural.innerHTML = `

                <div class="empty-card">

                    <span>📭</span>

                    <p>

                        Nenhum comunicado oficial recente.

                    </p>

                </div>

            `;

            return;

        }

        mural.innerHTML =

            recados.map(recado => `

                <div class="communication-item">

                    <div class="communication-icon">

                        <i class="fa-solid fa-bullhorn"></i>

                    </div>

                    <div class="communication-content">

                        <div class="communication-title">

                            ${escapeHTML(

                                recado.titulo ||

                                "Comunicado"

                            )}

                        </div>

                        <div class="communication-text">

                            ${escapeHTML(

                                recado.conteudo ||

                                ""

                            )}

                        </div>

                        <div class="communication-date">

                            Enviado por:

                            ${escapeHTML(

                                recado.autor ||

                                "Coordenação"

                            )}

                        </div>

                    </div>

                </div>

            `).join("");

    } catch (error) {

        console.error(

            "Erro nos comunicados:",

            error

        );

        mural.innerHTML = `

            <div class="empty-card">

                <span>⚠️</span>

                <p>

                    Não foi possível carregar os comunicados.

                </p>

            </div>

        `;

    }

}

/* =========================================================

   PLANEJAMENTOS

========================================================= */

async function carregarPlanejamentos() {

    const lista =

        document.getElementById("listaPlanejamentos");

    const contador =

        document.getElementById("planningCount");

    if (!lista) {

        return;

    }

    try {

        const response =

            await fetch("/listar-planejamentos");

        if (!response.ok) {

            throw new Error(

                "Erro ao carregar planejamentos."

            );

        }

        const dados =

            await response.json();

        const planejamentos =

            Array.isArray(dados)

                ? dados

                : [];

        if (contador) {

            contador.textContent =

                planejamentos.length;

        }

        if (planejamentos.length === 0) {

            lista.innerHTML = `

                <div class="empty-card">

                    <span>📝</span>

                    <p>

                        Você ainda não possui planejamentos salvos.

                    </p>

                </div>

            `;

            return;

        }

        lista.innerHTML =

            planejamentos.map(planejamento => `

                <article class="saved-planning">

                    <div class="planning-top">

                        <span class="planning-subject">

                            ${escapeHTML(

                                planejamento.materia ||

                                "Sem matéria"

                            )}

                        </span>

                        <span class="planning-date">

                            📅

                            ${formatDate(

                                planejamento.data_planejada

                            )}

                        </span>

                    </div>

                    <h3>

                        Planejamento de aula

                    </h3>

                    <p>

                        ${escapeHTML(

                            planejamento.conteudo ||

                            ""

                        )}

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

        console.error(

            "Erro nos planejamentos:",

            error

        );

        lista.innerHTML = `

            <div class="empty-card">

                <span>⚠️</span>

                <p>

                    Erro ao carregar planejamentos.

                </p>

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

    formPlanejamento.addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();

            const botao =

                this.querySelector(

                    "button[type='submit']"

                );

            const dados =

                new URLSearchParams(

                    new FormData(this)

                );

            try {

                if (botao) {

                    botao.disabled = true;

                    botao.textContent =

                        "SALVANDO...";

                }

                const response =

                    await fetch(

                        "/criar-planejamento",

                        {

                            method: "POST",

                            body: dados

                        }

                    );

                if (!response.ok) {

                    throw new Error(

                        "Não foi possível salvar."

                    );

                }

                this.reset();

                await carregarPlanejamentos();

                if (botao) {

                    botao.disabled = false;

                    botao.textContent =

                        "+ SALVAR PLANEJAMENTO";

                }

                mostrarMensagem(

                    "Planejamento salvo com sucesso!",

                    "success"

                );

            } catch (error) {

                console.error(error);

                if (botao) {

                    botao.disabled = false;

                    botao.textContent =

                        "+ SALVAR PLANEJAMENTO";

                }

                mostrarMensagem(

                    "Erro ao salvar o planejamento.",

                    "error"

                );

            }

        }

    );

}

/* =========================================================

   APAGAR PLANEJAMENTO

========================================================= */

async function apagarPlanejamento(id) {

    const confirmar =

        confirm(

            "Deseja realmente excluir este planejamento?"

        );

    if (!confirmar) {

        return;

    }

    try {

        const response =

            await fetch(

                `/apagar-planejamento/${id}`,

                {

                    method: "DELETE"

                }

            );

        if (!response.ok) {

            throw new Error(

                "Erro ao excluir."

            );

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

        const parts =

            dateValue.split("-");

        return `

            ${parts[2]}/${parts[1]}/${parts[0]}

        `;

    }

    const date =

        new Date(dateValue);

    if (isNaN(date.getTime())) {

        return dateValue;

    }

    return date.toLocaleDateString("pt-BR");

}

function parseEventDate(dateValue) {

    if (!dateValue) {

        return null;

    }

    if (

        typeof dateValue === "string" &&

        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)

    ) {

        const parts =

            dateValue.split("-");

        return new Date(

            Number(parts[0]),

            Number(parts[1]) - 1,

            Number(parts[2]),

            23,

            59,

            59

        );

    }

    const data =

        new Date(dateValue);

    if (isNaN(data.getTime())) {

        return null;

    }

    return data;

}

function escapeHTML(value) {

    if (

        value === null ||

        value === undefined

    ) {

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

    const antiga =

        document.querySelector(

            ".system-message"

        );

    if (antiga) {

        antiga.remove();

    }

    const elemento =

        document.createElement("div");

    elemento.className =

        "system-message";

    elemento.textContent =

        mensagem;

    elemento.style.position =

        "fixed";

    elemento.style.top =

        "20px";

    elemento.style.right =

        "20px";

    elemento.style.zIndex =

        "99999";

    elemento.style.padding =

        "15px 22px";

    elemento.style.borderRadius =

        "10px";

    elemento.style.backgroundColor =

        tipo === "success"

            ? "#22c55e"

            : "#ef4444";

    elemento.style.color =

        "#ffffff";

    elemento.style.fontSize =

        "16px";

    elemento.style.fontWeight =

        "600";

    elemento.style.boxShadow =

        "0 4px 15px rgba(0,0,0,0.25)";

    document.body.appendChild(

        elemento

    );

    setTimeout(() => {

        elemento.remove();

    }, 3000);

}

/* =========================================================

   NAVEGAÇÃO DAS PÁGINAS

========================================================= */

function configurarNavegacao() {

    const botoesMenu =

        document.querySelectorAll(

            ".menu-item[data-page]"

        );

    const paginas =

        document.querySelectorAll(

            ".page-section"

        );

    const tituloPagina =

        document.getElementById(

            "pageTitle"

        );

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

            pagina.style.display =

                "none";

        });

        const paginaSelecionada =

            document.getElementById(

                nomePagina

            );

        if (paginaSelecionada) {

            paginaSelecionada.style.display =

                "block";

        }

        if (tituloPagina) {

            tituloPagina.textContent =

                titulos[nomePagina] ||

                "EduClass";

        }

        botoesMenu.forEach(botao => {

            botao.classList.remove(

                "active"

            );

            if (

                botao.getAttribute(

                    "data-page"

                ) === nomePagina

            ) {

                botao.classList.add(

                    "active"

                );

            }

        });

        if (nomePagina === "calendario") {

            renderCalendarPage();

        }

        if (nomePagina === "planejamento") {

            carregarPlanejamentos();

        }

        fecharMenuMobile();

    }

    botoesMenu.forEach(botao => {

        botao.addEventListener(

            "click",

            event => {

                event.preventDefault();

                const pagina =

                    botao.getAttribute(

                        "data-page"

                    );

                mostrarPagina(

                    pagina

                );

            }

        );

    });

    document

        .querySelectorAll(

            "[data-go-page]"

        )

        .forEach(link => {

            link.addEventListener(

                "click",

                event => {

                    event.preventDefault();

                    const pagina =

                        link.getAttribute(

                            "data-go-page"

                        );

                    mostrarPagina(

                        pagina

                    );

                }

            );

        });

    mostrarPagina("inicio");

}

/* =========================================================

   MENU LATERAL

========================================================= */

function configurarMenuLateral() {

    const sidebar =

        document.getElementById(

            "sidebar"

        );

    const menuToggle =

        document.getElementById(

            "menuToggle"

        );

    const overlay =

        document.getElementById(

            "sidebarOverlay"

        );

    if (

        !sidebar ||

        !menuToggle

    ) {

        return;

    }

    menuToggle.addEventListener(

        "click",

        () => {

            if (

                window.innerWidth <= 768

            ) {

                sidebar.classList.toggle(

                    "mobile-open"

                );

                if (overlay) {

                    overlay.classList.toggle(

                        "active"

                    );

                }

            } else {

                sidebar.classList.toggle(

                    "collapsed"

                );

            }

        }

    );

    if (overlay) {

        overlay.addEventListener(

            "click",

            fecharMenuMobile

        );

    }

}

function fecharMenuMobile() {

    const sidebar =

        document.getElementById(

            "sidebar"

        );

    const overlay =

        document.getElementById(

            "sidebarOverlay"

        );

    if (sidebar) {

        sidebar.classList.remove(

            "mobile-open"

        );

    }

    if (overlay) {

        overlay.classList.remove(

            "active"

        );

    }

}

/* =========================================================

   DATA ATUAL

========================================================= */

function mostrarDataAtual() {

    const elemento =

        document.getElementById(

            "currentDate"

        );

    if (!elemento) {

        return;

    }

    const dataAtual =

        new Date();

    elemento.textContent =

        dataAtual.toLocaleDateString(

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

   BOTÕES DOS CALENDÁRIOS

========================================================= */

function configurarCalendario() {

    /* =====================================================

       CALENDÁRIO DO INÍCIO

    ===================================================== */

    const prevMonth =

        document.getElementById(

            "prevMonth"

        );

    const nextMonth =

        document.getElementById(

            "nextMonth"

        );

    if (prevMonth) {

        prevMonth.addEventListener(

            "click",

            () => {

                currentCalendarDate.setMonth(

                    currentCalendarDate.getMonth() - 1

                );

                renderCalendar();

            }

        );

    }

    if (nextMonth) {

        nextMonth.addEventListener(

            "click",

            () => {

                currentCalendarDate.setMonth(

                    currentCalendarDate.getMonth() + 1

                );

                renderCalendar();

            }

        );

    }

    /* =====================================================

       CALENDÁRIO DA PÁGINA DO MENU

    ===================================================== */

    const pagePrevMonth =

        document.getElementById(

            "calendarPagePrevMonth"

        );

    const pageNextMonth =

        document.getElementById(

            "calendarPageNextMonth"

        );

    if (pagePrevMonth) {

        pagePrevMonth.addEventListener(

            "click",

            () => {

                currentPageCalendarDate.setMonth(

                    currentPageCalendarDate.getMonth() - 1

                );

                renderCalendarPage();

            }

        );

    }

    if (pageNextMonth) {

        pageNextMonth.addEventListener(

            "click",

            () => {

                currentPageCalendarDate.setMonth(

                    currentPageCalendarDate.getMonth() + 1

                );

                renderCalendarPage();

            }

        );

    }

}

/* =========================================================

   TURMAS DA ÁREA DE NOTAS

========================================================= */

function carregarTurmasNotas() {

    const select =

        document.getElementById(

            "turmaNotas"

        );

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

        const option =

            document.createElement(

                "option"

            );

        option.value =

            turma;

        option.textContent =

            turma;

        select.appendChild(

            option

        );

    });

    select.addEventListener(

        "change",

        async function () {

            const turmaSelecionada =

                this.value;

            const lista =

                document.getElementById(

                    "listaNotas"

                );

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

                alunosCadastrados.filter(

                    aluno =>

                        aluno.turma ===

                        turmaSelecionada

                );

            if (

                alunosDaTurma.length === 0

            ) {

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

            lista.innerHTML =

                alunosDaTurma.map(aluno => `

                    <div class="nota-aluno">

                        <div class="aluno-info">

                            <strong>

                                ${escapeHTML(

                                    aluno.nome

                                )}

                            </strong>

                            <span>

                                ${escapeHTML(

                                    aluno.turma

                                )}

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

            const botaoSalvar =

                document.createElement(

                    "button"

                );

            botaoSalvar.type =

                "button";

            botaoSalvar.className =

                "btn btn-primary";

            botaoSalvar.textContent =

                "Salvar notas";

            botaoSalvar.style.marginTop =

                "20px";

            botaoSalvar.style.padding =

                "12px 20px";

            botaoSalvar.style.border =

                "none";

            botaoSalvar.style.borderRadius =

                "8px";

            botaoSalvar.style.cursor =

                "pointer";

            lista.appendChild(

                botaoSalvar

            );

            botaoSalvar.addEventListener(

                "click",

                async () => {

                    const campos =

                        lista.querySelectorAll(

                            ".campo-nota"

                        );

                    const notas = [];

                    campos.forEach(campo => {

                        if (

                            campo.value !== ""

                        ) {

                            notas.push({

                                aluno_id:

                                    campo.dataset.alunoId,

                                aluno_nome:

                                    campo.dataset.alunoNome,

                                turma:

                                    turmaSelecionada,

                                nota:

                                    Number(

                                        campo.value

                                    )

                            });

                        }

                    });

                    if (

                        notas.length === 0

                    ) {

                        mostrarMensagem(

                            "Digite pelo menos uma nota.",

                            "error"

                        );

                        return;

                    }

                    try {

                        const response =

                            await fetch(

                                "/salvar-notas",

                                {

                                    method: "POST",

                                    headers: {

                                        "Content-Type":

                                            "application/json"

                                    },

                                    body:

                                        JSON.stringify({

                                            turma:

                                                turmaSelecionada,

                                            notas:

                                                notas

                                        })

                                }

                            );

                        const resultado =

                            await response.json();

                        if (!response.ok) {

                            throw new Error(

                                resultado.erro ||

                                "Erro ao salvar as notas."

                            );

                        }

                        mostrarMensagem(

                            "Notas salvas com sucesso!",

                            "success"

                        );

                    } catch (error) {

                        console.error(

                            "Erro ao salvar notas:",

                            error

                        );

                        mostrarMensagem(

                            "Erro ao salvar as notas.",

                            "error"

                        );

                    }

                }

            );

        }

    );

}

/* =========================================================

   MOSTRAR ALUNOS DA TURMA

========================================================= */

function mostrarAlunos(idTurma) {

    const turma =

        window.turmasOrganizadas?.[idTurma];

    const detalhes =

        document.getElementById(

            "detalhesTurma"

        );

    const titulo =

        document.getElementById(

            "tituloDetalhesTurma"

        );

    const lista =

        document.getElementById(

            "listaAlunosTurma"

        );

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

        turma.alunos

            .map((aluno, index) => {

                return `

                    <div class="communication-item">

                        <div class="communication-icon">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        <div class="communication-content">

                            <div class="communication-title">

                                ${index + 1}.

                                ${escapeHTML(

                                    aluno.nome

                                )}

                            </div>

                            <div class="communication-text">

                                Aluno cadastrado pela Gestão

                            </div>

                        </div>

                    </div>

                `;

            })

            .join("");

    detalhes.style.display =

        "block";

}

/* =========================================================

   APAGAR TURMA

========================================================= */

async function apagarTurma(nomeTurma) {

    const confirmar =

        confirm(

            `⚠️ Tem certeza que deseja apagar a turma "${nomeTurma}"?\n\n` +

            `Os alunos cadastrados nessa turma também serão removidos.`

        );

    if (!confirmar) {

        return;

    }

    try {

        const response =

            await fetch(

                `/apagar-turma/${encodeURIComponent(nomeTurma)}`,

                {

                    method: "DELETE"

                }

            );

        const dados =

            await response.json();

        if (!response.ok) {

            throw new Error(

                dados.erro ||

                "Não foi possível apagar a turma."

            );

        }

        mostrarMensagem(

            "Turma apagada com sucesso!",

            "success"

        );

        await carregarAlunosDasTurmas();

        const detalhes =

            document.getElementById(

                "detalhesTurma"

            );

        if (detalhes) {

            detalhes.style.display =

                "none";

        }

    } catch (error) {

        console.error(

            "Erro ao apagar turma:",

            error

        );

        mostrarMensagem(

            error.message ||

            "Erro ao apagar a turma.",

            "error"

        );

    }

}

/* =========================================================

   ENTRAR EM OUTRA ESCOLA

========================================================= */

function configurarEntradaEmOutraEscola() {

    const botao =

        document.getElementById(

            "btnEntrarEscola"

        );

    const campo =

        document.getElementById(

            "codigoNovaEscola"

        );

    const resultado =

        document.getElementById(

            "resultadoEscola"

        );

    if (

        !botao ||

        !campo ||

        !resultado

    ) {

        return;

    }

    botao.addEventListener(

        "click",

        async () => {

            const codigo =

                campo.value

                    .trim()

                    .toUpperCase();

            if (!codigo) {

                resultado.innerHTML = `

                    <div class="empty-card">

                        <p>

                            Digite o código da escola.

                        </p>

                    </div>

                `;

                return;

            }

            botao.disabled =

                true;

            botao.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Verificando...

            `;

            try {

                const response =

                    await fetch(

                        "/vincular-escola",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":

                                    "application/json"

                            },

                            body:

                                JSON.stringify({

                                    codigo_escola:

                                        codigo

                                })

                        }

                    );

                const dados =

                    await response.json();

                if (!response.ok) {

                    throw new Error(

                        dados.erro ||

                        "Não foi possível entrar na escola."

                    );

                }

                resultado.innerHTML = `

                    <div class="empty-card">

                        <p>

                            ✅ Você entrou na escola

                            <strong>

                                ${escapeHTML(

                                    dados.escola.nome

                                )}

                            </strong>

                            com sucesso!

                        </p>

                    </div>

                `;

                campo.value = "";

            } catch (error) {

                console.error(

                    "Erro ao entrar na escola:",

                    error

                );

                resultado.innerHTML = `

                    <div class="empty-card">

                        <p>

                            ❌

                            ${escapeHTML(

                                error.message

                            )}

                        </p>

                    </div>

                `;

            } finally {

                botao.disabled =

                    false;

                botao.innerHTML = `

                    <i class="fa-solid fa-plus"></i>

                    Entrar em outra escola

                `;

            }

        }

    );

}

/* =========================================================

   MINHAS ESCOLAS

========================================================= */

async function carregarMinhasEscolas() {

    const lista =

        document.getElementById(

            "listaMinhasEscolas"

        );

    if (!lista) {

        return;

    }

    try {

        const response =

            await fetch(

                "/minhas-escolas"

            );

        if (!response.ok) {

            throw new Error(

                "Não foi possível carregar as escolas."

            );

        }

        const escolas =

            await response.json();

        if (!escolas.length) {

            lista.innerHTML = `

                <div class="empty-card">

                    <p>

                        Você ainda não está vinculado a nenhuma escola.

                    </p>

                </div>

            `;

            return;

        }

        lista.innerHTML = "";

        const escolaAtual =

            window.escolaAtualId ||

            null;

        escolas.forEach(escola => {

            const card =

                document.createElement(

                    "div"

                );

            card.style.cssText = `

                display: flex;

                align-items: center;

                justify-content: space-between;

                gap: 15px;

                padding: 16px;

                margin-bottom: 12px;

                border: 1px solid #dce6ef;

                border-radius: 12px;

                background: #f8fbff;

            `;

            const estaAtual =

                String(escola.id) ===

                String(escolaAtual);

            card.innerHTML = `

                <div>

                    <strong>

                        ${escapeHTML(

                            escola.nome

                        )}

                    </strong>

                    <div style="

                        margin-top: 5px;

                        font-size: 13px;

                        color: #718096;

                    ">

                        Código:

                        ${escapeHTML(

                            escola.codigo

                        )}

                    </div>

                </div>

                ${

                    estaAtual

                    ?

                    `<span style="

                        padding: 7px 12px;

                        border-radius: 20px;

                        background: #dff7e8;

                        color: #198754;

                        font-size: 13px;

                        font-weight: 600;

                    ">

                        ✓ Acessando agora

                    </span>`

                    :

                    `<button

                        type="button"

                        class="btn btn-primary btn-trocar-escola"

                        data-escola-id="${escola.id}"

                    >

                        Entrar

                    </button>`

                }

            `;

            lista.appendChild(

                card

            );

        });

        document

            .querySelectorAll(

                ".btn-trocar-escola"

            )

            .forEach(botao => {

                botao.addEventListener(

                    "click",

                    () => {

                        selecionarEscola(

                            botao.dataset.escolaId

                        );

                    }

                );

            });

    } catch (error) {

        console.error(error);

        lista.innerHTML = `

            <div class="empty-card">

                <p>

                    ❌ Não foi possível carregar suas escolas.

                </p>

            </div>

        `;

    }

}

/* =========================================================

   TROCAR DE ESCOLA

========================================================= */

async function selecionarEscola(escolaId) {

    try {

        const response =

            await fetch(

                "/selecionar-escola",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":

                            "application/json"

                    },

                    body:

                        JSON.stringify({

                            escola_id:

                                escolaId

                        })

                }

            );

        const dados =

            await response.json();

        if (!response.ok) {

            throw new Error(

                dados.erro ||

                "Não foi possível trocar de escola."

            );

        }

        window.location.reload();

    } catch (error) {

        alert(

            error.message

        );

        console.error(

            "Erro ao trocar de escola:",

            error

        );

    }

}

/* =========================================================

   LANÇAR NOTAS / VER NOTAS

========================================================= */

const btnLancarNotas =

    document.getElementById(

        "btnLancarNotas"

    );

const btnVerNotas =

    document.getElementById(

        "btnVerNotas"

    );

const areaLancarNotas =

    document.getElementById(

        "areaLancarNotas"

    );

const areaVerNotas =

    document.getElementById(

        "areaVerNotas"

    );

const btnAlterarNotas =

    document.getElementById(

        "btnAlterarNotas"

    );

let modoAlterarNotas =

    false;

/* =========================================================

   BOTÃO LANÇAR NOTAS

========================================================= */

if (btnLancarNotas) {

    btnLancarNotas.addEventListener(

        "click",

        () => {

            if (areaLancarNotas) {

                areaLancarNotas.style.display =

                    "block";

            }

            if (areaVerNotas) {

                areaVerNotas.style.display =

                    "none";

            }

        }

    );

}

/* =========================================================

   BOTÃO VER NOTAS

========================================================= */

if (btnVerNotas) {

    btnVerNotas.addEventListener(

        "click",

        () => {

            if (areaLancarNotas) {

                areaLancarNotas.style.display =

                    "none";

            }

            if (areaVerNotas) {

                areaVerNotas.style.display =

                    "block";

            }

            carregarTurmasVerNotas();

        }

    );

}

/* =========================================================

   CARREGAR TURMAS PARA VER NOTAS

========================================================= */

async function carregarTurmasVerNotas() {

    const select =

        document.getElementById(

            "turmaVerNotas"

        );

    if (!select) {

        return;

    }

    try {

        const response =

            await fetch(

                "/listar-alunos"

            );

        if (!response.ok) {

            throw new Error(

                "Erro ao carregar turmas."

            );

        }

        const alunos =

            await response.json();

        const turmas = [

            ...new Set(

                alunos

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

            const option =

                document.createElement(

                    "option"

                );

            option.value =

                turma;

            option.textContent =

                turma;

            select.appendChild(

                option

            );

        });

    } catch (error) {

        console.error(

            "Erro ao carregar turmas:",

            error

        );

    }

}

/* =========================================================

   QUANDO ESCOLHER A TURMA

========================================================= */

const turmaVerNotas =

    document.getElementById(

        "turmaVerNotas"

    );

if (turmaVerNotas) {

    turmaVerNotas.addEventListener(

        "change",

        async function () {

            const turma =

                this.value;

            const lista =

                document.getElementById(

                    "listaNotasSalvas"

                );

            if (!lista) {

                return;

            }

            if (!turma) {

                lista.innerHTML = `

                    <p>

                        Selecione uma turma para visualizar as notas.

                    </p>

                `;

                return;

            }

            lista.innerHTML = `

                <p>

                    Carregando notas...

                </p>

            `;

            try {

                const alunosResponse =

                    await fetch(

                        `/listar-alunos?turma=${encodeURIComponent(turma)}`

                    );

                if (!alunosResponse.ok) {

                    throw new Error(

                        "Erro ao carregar alunos."

                    );

                }

                const alunos =

                    await alunosResponse.json();

                const notasResponse =

                    await fetch(

                        `/listar-notas?turma=${encodeURIComponent(turma)}`

                    );

                if (!notasResponse.ok) {

                    throw new Error(

                        "Erro ao carregar notas."

                    );

                }

                const notas =

                    await notasResponse.json();

                const mapaNotas = {};

                notas.forEach(item => {

                    mapaNotas[item.aluno_id] =

                        Number(item.nota);

                });

                if (alunos.length === 0) {

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

                let html = `

                    <div style="

                        overflow-x: auto;

                        width: 100%;

                    ">

                        <table class="data-table">

                            <thead>

                                <tr>

                                    <th>

                                        Aluno

                                    </th>

                                    <th>

                                        Nota

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                `;

                alunos.forEach(aluno => {

                    const nota =

                        mapaNotas[aluno.id];

                    let classeNota =

                        "nota-vermelha";

                    let textoNota =

                        "Sem nota";

                    if (

                        nota !== undefined

                    ) {

                        textoNota =

                            nota

                                .toFixed(1)

                                .replace(".", ",");

                        if (nota >= 8) {

                            classeNota =

                                "nota-verde";

                        } else if (nota >= 5) {

                            classeNota =

                                "nota-amarela";

                        }

                    }

                    html += `

                        <tr>

                            <td>

                                ${escapeHTML(

                                    aluno.nome

                                )}

                            </td>

                            <td>

                                <span

                                    class="nota-valor ${classeNota}"

                                    data-aluno-id="${aluno.id}"

                                    data-nota="${

                                        nota !== undefined

                                            ? nota

                                            : 0

                                    }"

                                >

                                    ${textoNota}

                                </span>

                            </td>

                        </tr>

                    `;

                });

                html += `

                            </tbody>

                        </table>

                    </div>

                `;

                lista.innerHTML =

                    html;

            } catch (error) {

                console.error(

                    "Erro ao carregar notas:",

                    error

                );

                lista.innerHTML = `

                    <div class="empty-card">

                        <span>⚠️</span>

                        <p>

                            Não foi possível carregar as notas.

                        </p>

                    </div>

                `;

            }

        }

    );

}

/* =========================================================

   ALTERAR NOTAS

========================================================= */

if (btnAlterarNotas) {

    btnAlterarNotas.addEventListener(

        "click",

        async () => {

            const turmaElement =

                document.getElementById(

                    "turmaVerNotas"

                );

            const turma =

                turmaElement

                    ? turmaElement.value

                    : "";

            const lista =

                document.getElementById(

                    "listaNotasSalvas"

                );

            if (!turma) {

                mostrarMensagem(

                    "Selecione uma turma primeiro.",

                    "error"

                );

                return;

            }

            if (!modoAlterarNotas) {

                const campos =

                    lista.querySelectorAll(

                        ".nota-valor"

                    );

                campos.forEach(campo => {

                    const nota =

                        campo.dataset.nota;

                    const alunoId =

                        campo.dataset.alunoId;

                    campo.outerHTML = `

                        <input

                            type="number"

                            min="0"

                            max="10"

                            step="0.1"

                            class="campo-alterar-nota"

                            data-aluno-id="${alunoId}"

                            value="${nota}"

                            style="

                                width: 80px;

                                padding: 8px;

                                border: 1px solid #ccc;

                                border-radius: 6px;

                            "

                        >

                    `;

                });

                modoAlterarNotas =

                    true;

                btnAlterarNotas.textContent =

                    "Salvar alterações";

                return;

            }

            const inputs =

                lista.querySelectorAll(

                    ".campo-alterar-nota"

                );

            const notas = [];

            inputs.forEach(input => {

                const nota =

                    Number(input.value);

                notas.push({

                    aluno_id:

                        input.dataset.alunoId,

                    nota:

                        nota

                });

            });

            try {

                const response =

                    await fetch(

                        "/salvar-notas",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":

                                    "application/json"

                            },

                            body:

                                JSON.stringify({

                                    turma:

                                        turma,

                                    notas:

                                        notas

                                })

                        }

                    );

                const resultado =

                    await response.json();

                if (!response.ok) {

                    throw new Error(

                        resultado.erro ||

                        "Erro ao salvar alterações."

                    );

                }

                mostrarMensagem(

                    "Notas alteradas com sucesso!",

                    "success"

                );

                modoAlterarNotas =

                    false;

                btnAlterarNotas.textContent =

                    "Alterar notas";

                if (turmaElement) {

                    turmaElement.dispatchEvent(

                        new Event("change")

                    );

                }

            } catch (error) {

                console.error(

                    "Erro ao alterar notas:",

                    error

                );

                mostrarMensagem(

                    "Erro ao alterar as notas.",

                    "error"

                );

            }

        }

    );

}

/* =========================================================

   INICIALIZAÇÃO

========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        configurarNavegacao();

        configurarMenuLateral();

        configurarCalendario();

        configurarFormularioPlanejamento();

        mostrarDataAtual();

        renderCalendar();

        renderCalendarPage();

        carregarEventosDaDirecao();

        carregarRecadosDaDirecao();

        carregarPlanejamentos();

        carregarAlunosDasTurmas();

        configurarEntradaEmOutraEscola();

        carregarMinhasEscolas();

    }

);