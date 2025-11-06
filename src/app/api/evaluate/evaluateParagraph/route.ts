// // import { NextResponse } from 'next/server';

// // export async function POST(request: Request) {
// //   try {
// //     const body = await request.json();
// //     const { questions } = body;

// //     if (!questions || !Array.isArray(questions)) {
// //       return NextResponse.json({ message: "Questions array is required" }, { status: 400 });
// //     }

// //     const evaluationResults = [];
// //     for (const question of questions) {
// //       if (question.topic_id === "Paragraph") {
// //         const payload = {
// //           question: question.question,
// //           answer: question.user_answer,
// //         };

// //         try {
// //           const response = await fetch("https://aiservices.pragmatiqinc.com/evaluate", {
// //             method: "POST",
// //             mode: "no-cors",
// //             headers: {
// //               "X-API-Key": "1234567890abcdef1234567890abcdef",
// //               "Content-Type": "application/json",
// //             },
// //             body: JSON.stringify(payload),
// //           });

// //           if (response.ok) {
// //             const result = await response.json();
// //             evaluationResults.push({ question: question.question, result });
// //             console.log(result,'result')
// //           } else {
// //             console.error(
// //               "Error in paragraph evaluation API call:",
// //               response.status,
// //               response.statusText
// //             );
// //             evaluationResults.push({ question: question.question, error: "API call failed" });
// //           }
// //         } catch (error) {
// //           console.error("API call error for paragraph evaluation:", error);
// //           evaluationResults.push({ question: question.question, error: "API call error" });
// //         }
// //       }
// //     }

// //     return NextResponse.json({ evaluations: evaluationResults }, { status: 200 });
// //   } catch (error) {
// //     console.error("Error processing paragraph evaluation:", error);
// //     return NextResponse.json({ message: "Error processing paragraph evaluation" }, { status: 500 });
// //   }
// // }










// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma"; // Adjust this import path as necessary
// import logger from "@/lib/logger";
// export async function POST(request: Request) {
//     try {
//       const body = await request.json();
//       const { questions, test_id, user_test_id, subject_id } = body;
  
//       if (!questions || !Array.isArray(questions)) {
//         return NextResponse.json({ message: "Questions array is required" }, { status: 400 });
//       }
  
//        const host = request.headers.get('host'); // Get host from headers

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }
    
//     , { status: 500 });
//       }
  
//       const evaluationResults = [];
//       for (const question of questions) {
//         // if (question.topic_id === "Paragraph") {
//             if (true) {
//           const payload = {
//             question: question.question,
//             answer: question.user_answer,
//           };
  
//           try {
//             const response = await fetch("https://aiservices.pragmatiqinc.com/evaluate", {
//               method: "POST",
//               headers: {
//                 "X-API-Key": "1234567890abcdef1234567890abcdef",
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify(payload),
//             });
  
//             if (response.ok) {
//               const result = await response.json();

//               const rawJson = result.evaluation.replace(/```json\n|```/g, '');
//   const parsedJson = JSON.parse(rawJson);
//   const finalScore = parsedJson.finalScore
//   const relevanceAssessment = parsedJson.relevanceAssessment
//   const logicalConsistencyAssessment = parsedJson.logicalConsistencyAssessment
//   const grammarSpellingSyntaxAssessment = parsedJson.grammarSpellingSyntaxAssessment

  
  
              
  
//               const updateResult = await pool.request()
//                 .input("FinalScore", finalScore)
//                 .input("RelevanceAssessment", relevanceAssessment)
//                 .input("LogicalConsistencyAssessment", logicalConsistencyAssessment)
//                 .input("GrammarSpellingSyntaxAssessment", grammarSpellingSyntaxAssessment)
//                 .input("UserTestId", user_test_id)
//                 .input("TestId", test_id)
//                 .input("SubjectId", subject_id)
//                 .query(`
//                   UPDATE [dbo].[USER_TEST_DETAILS]
//                   SET 
//                       [FINAL_SCORE] = @FinalScore,
//                       [RELEVENCE] = @RelevanceAssessment,
//                       [LOGICAL_CONSISTENCY] = @LogicalConsistencyAssessment,
//                       [GRAMMAR_SPELLING] = @GrammarSpellingSyntaxAssessment,
//                       [modified_date] = GETDATE()
//                   WHERE 
//                       [user_test_id] = @UserTestId
//                       AND [test_id] = @TestId
//                       AND [subject_id] = @SubjectId;
//                 `);
  
//               console.log("Update Query Result:", updateResult);
  
//               evaluationResults.push({ question: question.question, result });
//             } else {
//               console.error("API call failed:", response.status, response.statusText);
//               evaluationResults.push({ question: question.question, error: "API call failed" });
//             }
//           } catch (error) {
//             console.error("Error calling evaluation API:", error);
//             evaluationResults.push({ question: question.question, error: "API call error" });
//           }
//         }
//       }
  
//       return NextResponse.json({ evaluations: evaluationResults }, { status: 200 });
//     } catch (error) {
//       logger.error(`Error processing evaluation:${error}`)
//       console.error("Error processing evaluation:", error);
//       return NextResponse.json({ message: "Error processing evaluation" }, { status: 500 });
//     }
//   }
  
















import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questions, test_id, user_test_id, subject_id } = body;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ message: "Questions array is required" }, { status: 400 });
    }

    const evaluationResults = [];

    for (const question of questions) {
      // if (question.topic_id === "Paragraph") {
      if (true) {
        const payload = {
          question: question.question,
          answer: question.user_answer,
        };

        try {
          const response = await fetch("https://aiservices.pragmatiqinc.com/evaluate", {
            method: "POST",
            headers: {
              "X-API-Key": "1234567890abcdef1234567890abcdef",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            evaluationResults.push({ question: question.question, error: "API call failed" });
            continue;
          }

          const result = await response.json();
          const rawJson = result.evaluation.replace(/```json\n|```/g, "");
          const parsedJson = JSON.parse(rawJson);

          const updated = await prisma.user_test_details.updateMany({
            where: {
              user_test_id: user_test_id,
              test_id: test_id,
              subject_id: subject_id,
            },
            data: {
              final_score: parsedJson.finalScore.toString(),
              relevence: parsedJson.relevanceAssessment,
              logical_consistency: parsedJson.logicalConsistencyAssessment,
              grammar_spelling: parsedJson.grammarSpellingSyntaxAssessment,
              modified_date: new Date(),
            },
          });

          evaluationResults.push({ question: question.question, result: parsedJson });
        } catch (error) {
          console.error("Error calling evaluation API:", error);
          evaluationResults.push({ question: question.question, error: "API call error" });
        }
      }
    }

    return NextResponse.json({ evaluations: evaluationResults }, { status: 200 });
  } catch (error) {
    logger.error(`Error processing evaluation: ${error}`);
    return NextResponse.json({ message: "Error processing evaluation" }, { status: 500 });
  }
}
