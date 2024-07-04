import React, { useState, useEffect } from 'react';
import { TextField, PrimaryButton, Toggle } from '@fluentui/react';
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';
import styles from './Generate.module.css'; 


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

    const downloadDocx = () => {
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph(textFieldValue),
                    ],
                },
            ],
        });

        // Generate DOCX file from the document
        Packer.toBlob(doc).then(blob => {
            // Use FileSaver to save the generated Blob
            saveAs(blob, "export.docx");
        });
    }

        return (
            <div>
                <h1 style={{ textAlign: "center" }}>TCOT Generator</h1>

                <form onSubmit={handleSubmit} >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                    <TextField
                        label="Category Name"
                        name="category_name"
                        value={searchParams.category_name}
                        onChange={handleInputChange}
                        placeholder="eg. 4.2 Land Use and Quantum"
                        style={{  width: '500px' }}
                    />
                    <TextField
                        label="Site Type"
                        name="sitetype"
                        value={searchParams.sitetype}
                        onChange={handleInputChange}
                        placeholder="eg. RESIDENTIAL"
                        style={{  width: '500px' }}
                    />
                    <TextField
                        label="Location"
                        name="location"
                        value={searchParams.location}
                        onChange={handleInputChange}
                        placeholder="eg. Upper Thomson"
                        style={{  width: '500px' }}
                    />
                    <TextField
                        label="Prompt: Specify details you are looking for e.g. ECDC"
                        name="search_prompt_txt"
                        value={searchParams.search_prompt_txt}
                        onChange={handleInputChange}
                        placeholder="eg. Early Childhood Development"
                        style={{  width: '500px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',marginTop: '20px'  }}>
                        <PrimaryButton text="Submit" onClick={handleSubmit} allowDisabledFocus />
                    </div>

                    <h5 style={{ textAlign: "center", marginTop: '20px' }}>
    Generator Status: {isGeneratingResult ? <span style={{ color: '#FF8C00' }}>Processing</span> : <span style={{ color: 'darkgreen' }}>Ready</span>}
</h5>

                    <h5 style={{ textAlign: "center", marginTop: '20px'  }}>TCOT DRAFT EDITOR</h5>

                    <TextField
                        name="generated_txt"
                        value={textFieldValue}
                        //readOnly // Assuming this field is not meant to be edited by the user
                        // placeholder="Generated Text"
                        multiline
                        autoAdjustHeight
                        disabled={!generatedResult}
                        onChange={handleTextFieldChange}
                        style={{  width: '1000px',  margin: 'auto' }}
                    />
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop:'10px' }}>
                        <PrimaryButton onClick={downloadDocx}>Download Docx</PrimaryButton>
                    </div>
                </form>

                <hr />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                                        style={{  width: '300px',  margin: 'auto' }}
                                    />
                                </> :
                                <>
                                </>
                        }
                        </div>
            </div>
        );
    };

    export default Generate;