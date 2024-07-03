import React, { useState, useEffect } from 'react';
import { TextField, PrimaryButton, Toggle } from '@fluentui/react';


const Generate = () => {

    const [eventID, setEventID] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useState({
        category_name: "",
        sitetype: "",
        location: "",
        search_prompt_txt: "",
    });

    const [generatedResult, setGeneratedResult] = useState<any>(null);

    const [isGeneratingResult, setIsGeneratingResult] = useState(false);

    const [textFieldValue, setTextFieldValue] = useState(generatedResult);

    const [showGradioSetting, setShowGradioSetting] = useState(false);
    const [gradioURL, setGradioURL] = useState<string | null>(null);

    // Update textFieldValue when generatedResult changes
    useEffect(() => {
        setTextFieldValue(generatedResult);
    }, [generatedResult]);

    const handleTextFieldChange = (event: any, newValue: any) => {
        setTextFieldValue(newValue);
    };

    const handleInputChange = (e: any) => {
        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value,
        });
    };

    const handleToggleChange = (e: any) => {
        setShowGradioSetting(!showGradioSetting);
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // create the variable of gradio url for post
        var post_endpoint = gradioURL + '/call/message_generator';
        var param_array = Object.values(searchParams);
        var body = { "data": param_array };

        try {
            const response = await fetch(post_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
            setEventID(data.event_id);
            setIsGeneratingResult(true);
            getGeneratedResult(data.event_id);

        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    const getGeneratedResult = async (event_id: string) => {
        console.log("Processing: " + event_id);

        var get_endpoint = gradioURL + '/call/message_generator/' + event_id;

        try {
            const response = await fetch(get_endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            console.log(data);

            // process the response body
            const lines = data.split('\n');

            // brute force approach to find the line that contains the data
            const completeEventLine = lines.find(line => line.startsWith('data: ['));

            if (completeEventLine) {
                // Step 4: Extract the data part
                const dataPart = completeEventLine.split('data: ')[1];

                // Step 5: Parse the data
                try {
                    const data = JSON.parse(dataPart);

                    // Step 6: Access the text
                    if (data && data.length > 0) {
                        setGeneratedResult(data[0]);
                        setIsGeneratingResult(false);
                    }
                } catch (error) {
                    console.error('Error parsing data:', error);
                    setIsGeneratingResult(false);
                }
            }

        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }

    };



    return (
        <div>
            <h1 style={{ textAlign: "center" }}>TCOT Generator</h1>

            <form onSubmit={handleSubmit}>
                <TextField
                    label="Category Name"
                    name="category_name"
                    value={searchParams.category_name}
                    onChange={handleInputChange}
                    placeholder="Category Name"
                />
                <TextField
                    label="Site Type"
                    name="sitetype"
                    value={searchParams.sitetype}
                    onChange={handleInputChange}
                    placeholder="Site Type"
                />
                <TextField
                    label="Location"
                    name="location"
                    value={searchParams.location}
                    onChange={handleInputChange}
                    placeholder="Location"
                />
                <TextField
                    label="Prompt: Specify details you are looking for e.g. ECDC"
                    name="search_prompt_txt"
                    value={searchParams.search_prompt_txt}
                    onChange={handleInputChange}
                    placeholder="Search Prompt Text"
                />
                <h5 style={{ textAlign: "center" }}>TCOT Generation Status: {isGeneratingResult ? 'Generating...' : 'Idle'}</h5>
                <TextField
                    label="TCOTs DRAFT EDITOR"
                    name="generated_txt"
                    value={textFieldValue}
                    //readOnly // Assuming this field is not meant to be edited by the user
                    placeholder="Generated Text"
                    multiline
                    autoAdjustHeight
                    disabled={!generatedResult}
                    onChange={handleTextFieldChange}
                />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <PrimaryButton text="Submit" onClick={handleSubmit} allowDisabledFocus />
                </div>
            </form>

            <hr />
            <Toggle label="Show Setting" onText="On" offText="Off" onChange={handleToggleChange} />
            {
                showGradioSetting ? 
                <>
                <TextField
                    label="Gradio URL"
                    name="gradioURL"
                    value={gradioURL ?? ''}
                    onChange={(e, newValue) => setGradioURL(newValue || null)}
                    placeholder="Gradio URL"
                />
                </> : 
                <>
                </>
            }

        </div>
    );
};

export default Generate;