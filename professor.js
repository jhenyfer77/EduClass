/* =========================================================
   EDUCLASS — PAINEL DO PROFESSOR
   JAVASCRIPT
========================================================= */


/* =========================================================
   VARIÁVEIS
========================================================= */

let currentCalendarDate = new Date();

let eventosEscolares = [];


/* =========================================================
   MESES
========================================================= */

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

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();


    const monthTitle =
        document.getElementById("calendarMonth");

    const calendarDays =
        document.getElementById("calendarDays");


    if (!monthTitle || !calendarDays) {
        return;
    }


    monthTitle.textContent =
        `${meses[month]} ${year}`;


    /*
       Primeiro dia do mês
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    /*
       Quantidade de dias do mês
    */

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    calendarDays.innerHTML = "";


    /*
       Espaços antes do primeiro dia
    */

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendarDays.appendChild(
            emptyDay
        );
    }


    /*
       Criar os dias
    */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement("div");


        dayElement.className =
            "calendar-day";


        /*
           Verificar se é hoje
        */

        const today =
            new Date();


        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {

            dayElement.classList.add(
                "today"
            );
        }


        /*
           Verificar eventos
        */

        const hasEvent =
            eventosEscolares.some(
                evento => {

                    const eventDate =
                        parseEventDate(
                            evento.data_evento
                        );


                    if (!eventDate) {
                        return false;
                    }


                    return (
                        eventDate.getDate() === day &&
                        eventDate.getMonth() === month &&
                        eventDate.getFullYear() === year
                    );

                }
            );


        if (hasEvent) {

            dayElement.classList.add(
                "has-event"
            );
        }


        /*
           Conteúdo do dia
        */

        dayElement.innerHTML = `
            <span>${day}</span>
            ${
                hasEvent
                    ? "<i></i>"
                    : ""
            }
        `;


        calendarDays.appendChild(
            dayElement
        );
    }

}


/* =========================================================
   CONVERTER DATA DO BANCO
========================================================= */

function parseEventDate(dateValue) {

    if (!dateValue) {
        return null;
    }


    /*
       Se já for uma data
    */

    if (
        dateValue instanceof Date
    ) {

        return dateValue;
    }


    /*
       Formato YYYY-MM-DD
    */

    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {

        const parts =
            dateValue.split("-");


        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    }


    const date =
        new Date(dateValue);


    if (
        isNaN(date.getTime())
    ) {

        return null;
    }


    return date;
}


/* =========================================================
   NAVEGAÇÃO DO CALENDÁRIO
========================================================= */

const previousMonth =
    document.getElementById(
        "previousMonth"
    );


if (previousMonth) {

    previousMonth.addEventListener(
        "click",
        () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() - 1
            );


            renderCalendar();

        }
    );
}


const nextMonth =
    document.getElementById(
        "nextMonth"
    );


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


/* =========================================================
   BOTÃO HOJE
========================================================= */

const currentMonthButton =
    document.getElementById(
        "currentMonthButton"
    );


if (currentMonthButton) {

    currentMonthButton.addEventListener(
        "click",
        () => {

            currentCalendarDate =
                new Date();


            renderCalendar();

        }
    );
}


/* =========================================================
   CARREGAR EVENTOS
========================================================= */

async function carregarEventosDaDirecao() {

    try {

        const response =
            await fetch(
                "/listar-eventos"
            );


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


        mostrarProximoEvento();

    }

    catch (error) {

        console.error(
            "Erro nos eventos:",
            error
        );


        eventosEscolares = [];


        renderCalendar();


        const title =
            document.getElementById(
                "nextEventTitle"
            );


        const date =
            document.getElementById(
                "nextEventDate"
            );


        if (title) {

            title.textContent =
                "Nenhum evento encontrado";
        }


        if (date) {

            date.textContent =
                "Não foi possível carregar a agenda.";
        }

    }

}


/* =========================================================
   PRÓXIMO EVENTO
========================================================= */

function mostrarProximoEvento() {

    const title =
        document.getElementById(
            "nextEventTitle"
        );


    const dateElement =
        document.getElementById(
            "nextEventDate"
        );


    if (
        !title ||
        !dateElement
    ) {
        return;
    }


    const agora =
        new Date();


    const eventosFuturos =
        eventosEscolares

            .map(evento => {

                const data =
                    parseEventDate(
                        evento.data_evento
                    );


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

            .sort(
                (a, b) =>
                    a.dataConvertida -
                    b.dataConvertida
            );


    if (
        eventosFuturos.length === 0
    ) {

        title.textContent =
            "Nenhum próximo evento";


        dateElement.textContent =
            "Sua agenda está livre.";

        return;
    }


    const proximo =
        eventosFuturos[0];


    title.textContent =
        proximo.titulo ||
        "Evento escolar";


    const data =
        proximo.dataConvertida;


    dateElement.textContent =
        `📅 ${data.toLocaleDateString(
            "pt-BR"
        )}`;

}


/* =========================================================
   COMUNICADOS
========================================================= */

async function carregarRecadosDaDirecao() {

    const mural =
        document.getElementById(
            "muralDirecao"
        );


    if (!mural) {
        return;
    }


    try {

        const response =
            await fetch(
                "/listar-recados"
            );


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
                        Nenhum comunicado
                        oficial recente.
                    </p>

                </div>

            `;

            return;
        }


        mural.innerHTML =
            recados.map(
                recado => `

                <article
                    class="announcement"
                >

                    <div
                        class="announcement-icon"
                    >
                        📢
                    </div>


                    <div
                        class="announcement-content"
                    >

                        <span
                            class="announcement-tag"
                        >
                            COMUNICADO
                        </span>


                        <h3>
                            ${escapeHTML(
                                recado.titulo
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                recado.conteudo
                            )}
                        </p>


                        <small>
                            Enviado por:
                            <strong>
                                ${escapeHTML(
                                    recado.autor ||
                                    "Coordenação"
                                )}
                            </strong>
                        </small>

                    </div>

                </article>

            `
            ).join("");

    }

    catch (error) {

        console.error(
            "Erro nos comunicados:",
            error
        );


        mural.innerHTML = `

            <div class="empty-card">

                <span>⚠️</span>

                <p>
                    Não foi possível
                    carregar os comunicados.
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
        document.getElementById(
            "listaPlanejamentos"
        );


    const contador =
        document.getElementById(
            "planningCount"
        );


    if (!lista) {
        return;
    }


    try {

        const response =
            await fetch(
                "/listar-planejamentos"
            );


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


        if (
            planejamentos.length === 0
        ) {

            lista.innerHTML = `

                <div class="empty-card">

                    <span>📝</span>

                    <p>
                        Você ainda não possui
                        planejamentos salvos.
                    </p>

                </div>

            `;

            return;
        }


        lista.innerHTML =
            planejamentos.map(
                planejamento => `

                <article
                    class="saved-planning"
                >

                    <div
                        class="planning-top"
                    >

                        <span
                            class="planning-subject"
                        >
                            ${escapeHTML(
                                planejamento.materia
                            )}
                        </span>


                        <span
                            class="planning-date"
                        >
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
                            planejamento.conteudo
                        )}
                    </p>


                    <button
                        type="button"
                        onclick="apagarPlanejamento(${Number(
                            planejamento.id
                        )})"
                        class="delete-planning"
                    >
                        Excluir planejamento
                    </button>

                </article>

            `
            ).join("");

    }

    catch (error) {

        console.error(
            "Erro nos planejamentos:",
            error
        );


        lista.innerHTML = `

            <div class="empty-card">

                <span>⚠️</span>

                <p>
                    Erro ao carregar
                    planejamentos.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   SALVAR PLANEJAMENTO
========================================================= */

const formPlanejamento =
    document.getElementById(
        "formPlanejamento"
    );


if (formPlanejamento) {

    formPlanejamento.addEventListener(
        "submit",
        async function(event) {

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

                botao.disabled = true;


                botao.innerHTML = `
                    <span>
                        SALVANDO...
                    </span>
                    <b>
                        ◌
                    </b>
                `;


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


                botao.disabled = false;


                botao.innerHTML = `
                    <span>
                        + SALVAR PLANEJAMENTO
                    </span>

                    <b>
                        →
                    </b>
                `;


                mostrarMensagem(
                    "Planejamento salvo com sucesso!",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    error
                );


                botao.disabled = false;


                botao.innerHTML = `
                    <span>
                        + SALVAR PLANEJAMENTO
                    </span>

                    <b>
                        →
                    </b>
                `;


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

    }

    catch (error) {

        console.error(
            error
        );


        mostrarMensagem(
            "Não foi possível excluir o planejamento.",
            "error"
        );

    }

}


/* =========================================================
   FORMATAR DATA
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


        return (
            `${parts[2]}/${parts[1]}/${parts[0]}`
        );
    }


    const date =
        new Date(dateValue);


    if (
        isNaN(date.getTime())
    ) {

        return dateValue;
    }


    return date.toLocaleDateString(
        "pt-BR"
    );

}


/* =========================================================
   SEGURANÇA
   Evita inserir HTML vindo do banco
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   MENSAGEM TEMPORÁRIA
========================================================= */

function mostrarMensagem(
    mensagem,
    tipo
) {

    const antiga =
        document.querySelector(
            ".system-message"
        );


    if (antiga) {
        antiga.remove();
    }


    const elemento =
        document.createElement(
            "div"
        );


    elemento.className =
        `system-message ${tipo}`;


    elemento.textContent =
        mensagem;


    document.body.appendChild(
        elemento
    );


    setTimeout(
        () => {

            elemento.classList.add(
                "hide"
            );


            setTimeout(
                () => elemento.remove(),
                300
            );

        },
        3000
    );

}


/* =========================================================
   ANIMAÇÃO DOS CARDS
========================================================= */

function animarCards() {

    const cards =
        document.querySelectorAll(
            ".dashboard-card"
        );


    cards.forEach(
        (card, index) => {

            card.style.opacity = "0";

            card.style.transform =
                "translateY(15px)";


            setTimeout(
                () => {

                    card.style.transition =
                        "opacity .5s ease, transform .5s ease";

                    card.style.opacity =
                        "1";

                    card.style.transform =
                        "translateY(0)";

                },
                80 * index
            );

        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCalendar();

        carregarEventosDaDirecao();

        carregarRecadosDaDirecao();

        carregarPlanejamentos();

        animarCards();

    }
);