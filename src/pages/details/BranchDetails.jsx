import React from 'react'
import { useParams } from 'react-router-dom';

const BranchDetails = () => {

    const {id} = useParams();
  return (
    <div>BranchDetails</div>
  )
}

export default BranchDetails;