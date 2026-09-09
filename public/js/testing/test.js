import { DrawElement, ShowLoadingOverlay } from "../misc/helpers.js";
import { pageContainer, testNumA, testNumQ } from "../state/app_state.js";


export function OpenTestingModal(container)
{
    return new Promise(
        resolve => {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
            
            const modalContainer = DrawElement(overlay, "div", ["modal-container"]);
            const modalTextContainer = DrawElement(modalContainer, "div", ["modal-text-container"]);
            const modalText = DrawElement(modalTextContainer, "h2", ["modal-text"], "Test your knowlegde")

            const testContainer = DrawElement(modalContainer, "div", ["test-container"]);

            const createTestButton = DrawElement(testContainer, "button", ["modal-btn-confirm"], "Create a test!");
            createTestButton.addEventListener("click", async () => {
                createTestButton.classList.toggle("hidden", true);
                const hideOverlay = await ShowLoadingOverlay();
                try{
                    await DrawTest(testContainer);
                }
                finally{
                    hideOverlay();
                }
            })

            const modalBtnContainer = DrawElement(modalContainer, "div", ["modal-btn-container"]);
            const modalBtnCancel = DrawElement(modalBtnContainer, "button", ["modal-btn-cancel"], "Close");
        
            modalBtnCancel.addEventListener("click", () =>
            {
                overlay.remove();
                resolve(false);
            })

            document.body.appendChild(overlay);
        }
    )
}

async function DrawTest(container)
{
    // Format testa:
    // const QAs = [
    //     {
    //         question: "What is 2+2?",
    //         answers: [
    //             {
    //                 text: "4",
    //                 correct: true
    //             },
    //             {
    //                 text: "2",
    //                 correct: false
    //             },
    //             {
    //                 text: "10",
    //                 correct: false
    //             }
    //         ]
    //     },
    //     {
    //         question: "What is the largest?",
    //         answers: [
    //             {
    //                 text: "The elephant",
    //                 correct: true
    //             },
    //             {
    //                 text: "The mouse",
    //                 correct: false
    //             },
    //             {
    //                 text: "The cat",
    //                 correct: false
    //             }
    //         ]
    //     },
    //     {
    //         question: "What is C++?",
    //         answers: [
    //             {
    //                 text: "Programming language",
    //                 correct: true
    //             },
    //             {
    //                 text: "Natural language",
    //                 correct: false
    //             },
    //             {
    //                 text: "Code for nuclear bomb",
    //                 correct: false
    //             }
    //         ]
    //     }
    // ] //Ovo se dobija od AI

    const activePage = pageContainer.querySelector(".active-page");
    const pageContent = activePage.querySelector(".page-content");
    const pageContentText = pageContent.textContent;

    const response = await fetch("/api/create-test", {
                method : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({text: pageContentText, numQ: `${testNumQ}`, numA: `${testNumA}`})
            });
    
    if(!response.ok)
    {
        const err = await response.json();
        alert(`Response is not ok!: ${err.error}`);
        return;
    }
    
    const {qas: QAs} = await response.json();
    console.log(QAs)

    const pointsLbl = DrawElement(container, "p", ["test-points"], "Correct: ");
    const pointsValue = DrawElement(pointsLbl, "span", ["test-points"], "0");

    QAs.questions.forEach((q, qId) => {
        ShuffleArray(q.answers);
        const questionContainer = DrawElement(container, "div", ["question-container"]);
        const questionText = DrawElement(questionContainer, "p", ["question-text"], q.question);
        const answersContainer = DrawElement(questionContainer, "div", ["answers-container"])
        q.answers.forEach(a => {
            const answerLbl = DrawElement(answersContainer, "label", ["custom-test-radio"], a.text);
            const answerRadioBtn = DrawElement(answerLbl, "input", ["test-radio"])
            answerRadioBtn.type = "radio";
            answerRadioBtn.id = a.text;
            answerRadioBtn.name = `question-${qId}`
            answerRadioBtn.value = a.correct;

            answerRadioBtn.addEventListener("change", () => {
                answerLbl.classList.add(a.correct ? "answer-correct" : "answer-incorrect");
                const radios = answersContainer.querySelectorAll(".test-radio");
                radios.forEach(radio => {
                    radio.disabled = true;
                })
                if(a.correct){
                    pointsValue.textContent = Number(pointsValue.textContent) + 1;
                }
            })
        })
    });
}

function ShuffleArray(array)
{
    for (let i = array.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}