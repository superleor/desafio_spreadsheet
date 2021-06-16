const express = require("express")
const { google } = require("googleapis")

const app = express()

app.get('/', async (req, res) => {
    
    //for getting proper authorization from the google spreadsheets API
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient()

    const sheets = google.sheets({ version: 'v4', auth: client });

    //ID for my copy of the spreadsheet
    const spreadsheetId = "1JQVnvkzptgX57MfdMGVUB4wH5BYkoANsiqXJsoLfV6k"

    //the situation and (if needed) grades for each student to pass will be stored here
    let sit = []

    //firstly it stores the values from the spreadSheet into a const
    const studentsData = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'engenharia_de_software!A4:F27'
    })

    let rows = studentsData.data.values

    if (rows.length) {
        rows.map((row) => {
            if (row[2] > 15) { //number of classes that can be missed
                sit[row[0] - 1] = [
                    'Reprovado por falta',
                    0
                ]
            } else {
                let average = Math.ceil((parseInt(row[3]) + parseInt(row[4]) + parseInt(row[5])) / 3) //average of the grade, rounded up
                if (average < 50) {
                    sit[row[0] - 1] = [
                        'Reprovado por nota',
                        0
                    ]
                } else if (average >= 50 && average < 70) {
                    sit[row[0] - 1] = [
                        'Exame Final',
                        100 - average
                    ]
                } else if (average > 70) {
                    sit[row[0] - 1] = [
                        'Aprovado',
                        0
                    ]
                }
            }
        })
    } else {
        console.log('No data found.');
    }

    //now for writing in the spreadsheet itself

    let resource = {
        values: sit
    }
    await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'engenharia_de_software!G4:H27',
        valueInputOption: 'USER_ENTERED',
        resource
    })

    res.send(sit)
})

app.listen(3000, (req, res) => console.log('running on 3000'))