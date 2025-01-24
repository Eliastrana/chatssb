'use client';

/*
Forsøket her er å først finne frem til en API med id inni tittel, 5 siffer
Deretter tar den disse 5 sifrene og bruker den i urlen etter table
og prøver å kjøre GET på den.
Etter det tar den body fra GET requesten og setter headers og deretter
prøver å bruke POST. Dette feiler, og er litt upresit, men bør funke hvis det fikses
 */

export async function fetchAndPostJson(url: string) {
    console.log(`Fetching data from: ${url}`);

    // 1) GET
    const getResponse = await fetch(url, { method: 'GET' });
    if (!getResponse.ok) {
        throw new Error(`Failed GET. Status: ${getResponse.status}`);
    }
    const getData = await getResponse.json();

    // 2) POST
    const postResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: getData }),
    });

    if (!postResponse.ok) {
        throw new Error(`Failed POST. Status: ${postResponse.status}`);
    }
    const postData = await postResponse.json();
    return postData;
}


export async function fetchSsbTable(tableId: string) {
    const tableUrl = `https://data.ssb.no/api/v0/no/table/${tableId}`;

    // 1) GET
    const getResp = await fetch(tableUrl, { method: 'GET' });
    if (!getResp.ok) {
        throw new Error(`GET request failed. Status: ${getResp.status}`);
    }
    const getData = await getResp.json();

    // 2) POST
    const postResp = await fetch(tableUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: getData }),
    });

    if (!postResp.ok) {
        throw new Error(`POST request failed. Status: ${postResp.status}`);
    }
    const postData = await postResp.json();

    return postData;
}
