import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { walletActionsL1, publicActionsL2, getL2TransactionHashes } from 'viem/op-stack';
import { mainnet } from 'viem/chains';
import { L2Chain } from '../../config/chain';
import TabMenu from '../TabMenu'; // TabMenu 컴포넌트를 import 해야합니다.


const Deposit = () => {
    const [formData, setFormData] = useState({
        ethValue: '',
        sendToken: 'ETH',
        errorInput: null,
        loader: false,
        hash: null,
        error: null,
        checkMetaMask: ""
    });

    const switchNetwork = () => {
        window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + process.env.REACT_APP_L2_CHAIN_ID.toString(16) }],
        }).catch((error) => {
            if (error.code === 4902) {
                window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{ chainId: '0x' + process.env.REACT_APP_L2_CHAIN_ID.toString(16) }],
                });
            }
        });
    }

    const handleDeposit = async () => {
        const { ethValue, sendToken } = formData;
        if (!ethValue) {
            setFormData(prevState => ({
                ...prevState,
                errorInput: "Please enter the amount."
            }));
            return;
        } else if (ethValue < 0) {
            setFormData(prevState => ({
                ...prevState,
                errorInput: "Please enter a valid amount: " + ethValue
            }));
            return;
        }

        const publicClientL1 = createPublicClient({
            chain: mainnet,
            transport: http()
        });
        const walletClientL1 = createWalletClient({
            account,
            chain: mainnet,
            transport: custom(window.ethereum)
        }).extend(walletActionsL1());
        const publicClientL2 = createPublicClient({
            chain: L2Chain,
            transport: http()
        }).extend(publicActionsL2());
        
        try {
            switch (sendToken) {
                case 'ETH':
                    // Build parameters for the transaction on the L2.
                    const args = await publicClientL2.buildDepositTransaction({
                        mint: parseEther(eth),
                        // if address is empty, use account.address
                        to: account,
                    });
                    const hash = await walletClientL1.depositTransaction({
                        account,
                        request: args.request,
                        targetChain: L2Chain,
                    });
                    setLoader(true);
                    const receipt = await publicClientL2.waitForTransactionReceipt(hash);
                    const [l2Hash] = getL2TransactionHashes(receipt);
                    const l2Receipt = await publicClientL2.waitForTransactionReceipt(hash: l2Hash);
                    setHash(hash);
                    setLoader(false);
                    break;
                default:
                    // TODO
                    break;
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoader(false);
        }
    };

    const [checkDisabled, setCheckDisabled] = useState(false)
    const handleChange = (e) => {
        // check eth
        if (sendToken == 'ETH') {
            if (Number(data?.formatted) < e.target.value) {
                setErrorInput("Insufficient ETH balance.")
                setCheckDisabled(true)
            } else {
                setCheckDisabled(false)
                setErrorInput("")
            }
            setEthValue(e.target.value)
        } else {
        // check erc token ( not eth )

        }
    }

    return (
        <>
            <div className='bridge_wrap'>
                <TabMenu />
                <section className='deposit_wrap'>
                    <div className='deposit_price_wrap'>
                        <div className='deposit_price_title'>
                            <p>From</p>
                            <h5><FaEthereum /> Sepolia Testnet</h5>
                        </div>
                        <div className='deposit_input_wrap'>
                            <Form>
                                <div className='deposit_inner_input'>
                                    <Form.Control type='number' value={ethValue} onChange={handleChange} placeholder="0" min="0" step="any" />
                                    <Form.Select aria-label="Default select example" className='select_wrap' onChange={({ target }) => setSendToken(target.value)}>
                                        <option>ETH</option>
                                        <option value="DAI">DAI</option>
                                        <option value="USDC">USDC</option>
                                        <option value="USDT">USDT</option>
                                        <option value="wBTC">wBTC</option>
                                    </Form.Select>
                                </div>
                                <div className='input_icn_wrap'>
                                    {sendToken == "ETH" ? <span className='input_icn'><Ethereum style={{ fontSize: '1.5rem' }} /></span> : sendToken == "DAI" ? <span className='input_icn'><Dai style={{ fontSize: '1.5rem' }} /></span> : sendToken == "USDT" ? <span className='input_icn'><Usdt style={{ fontSize: '1.5rem' }} /></span> : sendToken == "wBTC" ? <span className='input_icn'><Btc style={{ fontSize: '1.5rem' }} /></span> : <span className='input_icn'><Usdc style={{ fontSize: '1.5rem' }} /></span>}
                                </div>
                            </Form>
                        </div>
                        {errorInput && <small className='text-danger'>{errorInput}</small>}
                        {sendToken == 'ETH' ? address && <p className='wallet_bal mt-2'>Balance: {Number(data?.formatted).toFixed(5)} ETH</p> : sendToken == 'USDT' ? address && <p className='wallet_bal mt-2'>Balance: {Number(dataUSDT.data?.formatted).toFixed(5)} USDT</p> : sendToken == 'DAI' ? address && <p className='wallet_bal mt-2'>Balance: {Number(dataDAI.data?.formatted).toFixed(5)} DAI</p> : sendToken == 'wBTC' ? address && <p className='wallet_bal mt-2'>Balance: {Number(datawBTC.data?.formatted).toFixed(5)} wBTC</p> : address && <p className='wallet_bal mt-2'>Balance: {Number(dataUSDC.data?.formatted).toFixed(5)} USDC</p>}

                    </div>
                    <div className='deposit_details_wrap'>
                        <div className="deposit_details">
                            <p>To</p>
                            <h5><Image src={toIcn} alt="To icn" fluid /> Race</h5>
                        </div>
                        <div className='deposit_inner_details'>
                            {sendToken == "ETH" ? <span className='input_icn'> <Ethereum style={{ fontSize: '1.5rem' }} /></span> : sendToken == "DAI" ? <span className='input_icn'><Dai style={{ fontSize: '1.5rem' }} /></span> : sendToken == "USDT" ? <span className='input_icn'> <Usdt style={{ fontSize: '1.5rem' }} /></span> : sendToken == "wBTC" ? <span className='input_icn'> <Btc style={{ fontSize: '1.5rem' }} /></span> : <span className='input_icn'> <Usdc style={{ fontSize: '1.5rem' }} /></span>}  <p> You’ll receive: {ethValue ? ethValue : "0"} {sendToken}</p>
                        </div>
                    </div>
                    <div className="deposit_btn_wrap">
                        {checkMetaMask === true ? <a className='btn deposit_btn' href='https://metamask.io/' target='_blank'><Image src={metamask} alt="metamask icn" fluid /> Please Install Metamask Wallet</a> : !isConnected ? <button className='btn deposit_btn' onClick={() => connect()}><IoMdWallet />Connect Wallet</button> : chain.id !== Number(process.env.REACT_APP_L1_CHAIN_ID) ? <button className='btn deposit_btn' onClick={switchNetwork}><HiSwitchHorizontal />Switch to Sepolia</button> :
                            checkDisabled ? <button className='btn deposit_btn' disabled={true}>Deposit</button> :
                                <button className='btn deposit_btn' onClick={handleDeposit} disabled={loader ? true : false}> {loader ? <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner> : "Deposit"} </button>}
                    </div>
                </section>
            </div>
        </>
    )
}

export default Deposit
