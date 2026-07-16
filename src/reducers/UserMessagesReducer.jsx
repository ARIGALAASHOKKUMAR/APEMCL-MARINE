export const initialState = 
{
    isDisplay:false,
    message:"", 
    classType:"success"
    
};


const messageReducer=(state=initialState,action)=>{

    switch(action.type)
    {
        case 'SHOW_MESSAGE': return{...state,isDisplay:true,message:action.payload,classType:action.classType};

        case 'HIDE_MESSAGE': return{...state,isDisplay:false}; 
       
        default : return state; 
    }
    }
    export default messageReducer;  