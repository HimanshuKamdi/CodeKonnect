import React, { useState, useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

const Editor = ({ filePathRef, fileContent, user }) => {
    const editorRef = useRef(null);
    const [edited, setEdited] = useState(false);


    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    value: fileContent,
                    height: "90vh"
                }
            );

            editorRef.current.setSize(null, "100vh");

            filePathRef.on('value', snapshot => {
                const fileData = snapshot.val();
                if (fileData && fileData.editedBy) { 
                    if (fileData.editedBy !== user) { 
                        const fileContent = fileData.fileContent;
                        if (fileContent !== null) {
                            editorRef.current.setValue(fileContent);
                        }
                    }
                } else if (fileData) { 
                    const fileContent = fileData.fileContent;
                    if (fileContent !== null) {
                        editorRef.current.setValue(fileContent);
                    }
                }
            });
            

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                if (origin !== 'setValue') {
                    filePathRef.child("editedBy").set(user);
                    filePathRef.child("fileContent").set(code);
                    if(!edited){
                        setEdited(true);
                        filePathRef.child("edited").set(true);
                    }
                }
            });
        }
        init();
    }, []);

    return <textarea id="realtimeEditor" value={fileContent} style={{ height: "90vh" }} ></textarea>;
};

export default Editor;
