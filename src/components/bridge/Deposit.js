import { useState, useEffect } from 'react';
import "../../assets/style/deposit.scss";
import { createPublicClient, createWalletClient, custom, http, parseEther, toHex } from 'viem';
import { walletActionsL1, publicActionsL2, getL2TransactionHashes } from 'viem/op-stack';
import { GetL1Chain, GetL2Chain } from '../../config/chain';
import toIcn from "../../assets/images/logo.png"
import TabMenu from '../TabMenu';
import { Form, Spinner, Image } from "react-bootstrap"
import { HiSwitchHorizontal } from "react-icons/hi"
import { Dai, Usdt, Usdc, Ethereum, Btc } from 'react-web3-icons';
import { IoMdWallet } from "react-icons/io"
import { FaEthereum } from "react-icons/fa"
import { useAccount, useConnect, useNetwork, useSwitchNetwork, useBalance, useToken } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import metamask from "../../assets/images/metamask.svg"

const Deposit = () => {
    const [ethValue, setEthValue] = useState("");
    const [sendToken, setSendToken] = useState("ETH");
    const { data: accountData, address, isConnected } = useAccount()
    const [errorInput, setErrorInput] = useState("");
    const [loader, setLoader] = useState("");
    const [checkMetaMask, setCheckMetaMask] = useState("");
    const { chain, chains } = useNetwork()

    const L1Chain = GetL1Chain();
    const L2Chain = GetL2Chain();

    const { connect, connectors, error, isLoading, pendingConnector } = useConnect({
        connector: new InjectedConnector({ chains }), onError(error) {
            console.log('Error', error)
        },
        onMutate(args) {
            console.log('Mutate', args)
            if (args.connector.ready === true) {
                setCheckMetaMask(false)
            } else {
                setCheckMetaMask(true)
            }
        },
        onSettled(data, error) {
            console.log('Settled', { data, error })
        },
        onSuccess(data) {
            console.log('Success', data)
        },
    })
    const { switchNetwork } = useSwitchNetwork({
        throwForSwitchChainNotSupported: true,
        onError(error) {
            console.log('Error', error)
        },
        onMutate(args) {
            console.log('Mutate', args)
        },
        onSettled(data, error) {
            console.log('Settled', { data, error })
        },
        onSuccess(data) {
            console.log('Success', data)
        },
    })

    const { data } = useBalance({ address: address, watch: true, chainId: L1Chain.id })

    const dataUSDT = useBalance({ address: address, token: process.env.REACT_APP_L1_USDT, watch: true, chainId: L1Chain.id })
    const dataDAI = useBalance({ address: address, token: process.env.REACT_APP_L1_DAI, watch: true, chainId: L1Chain.id })
    const dataUSDC = useBalance({ address: address, token: process.env.REACT_APP_L1_USDC, watch: true, chainId: L1Chain.id })
    const datawBTC = useBalance({ address: address, token: process.env.REACT_APP_L1_wBTC, watch: true, chainId: L1Chain.id })

    const handleSwitch = () => {
        switchNetwork(L1Chain.id)
    }

    const handleDeposit = async () => {
        if (!ethValue) {
            setErrorInput("Please enter the amount.")
            return;
        } else if (parseFloat(ethValue) <= 0) {
            setErrorInput("Please enter a valid amount: " + ethValue)
            return;
        }

        const [account] = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        const publicClientL1 = createPublicClient({
            chain: L1Chain,
            transport: http()
        });
        const walletClientL1 = createWalletClient({
            account,
            chain: L1Chain,
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
                        mint: parseEther(ethValue),
                        to: account,
                    });

                    setLoader(true);
                    const hash = await walletClientL1.depositTransaction(args);
                    const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
                    const [l2Hash] = getL2TransactionHashes(receipt);
                    const l2Receipt = await publicClientL2.waitForTransactionReceipt({
                        hash: l2Hash
                    });
                    console.log('L2 Receipt', l2Receipt);
                    setLoader(false);
                    break;
                default:
                    // TODO
                    break;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoader(false);
        }
    };

    const [checkDisabled, setCheckDisabled] = useState(false)
    const handleChange = (e) => {
        if (sendToken == 'ETH') {
            if (Number(data?.formatted) < e.target.value) {
                setErrorInput("Insufficient ETH balance.")
                setCheckDisabled(true)
            } else {
                setCheckDisabled(false)
                setErrorInput("")
            }
            setEthValue(e.target.value)
        }
        if (sendToken == 'DAI') {
            if (Number(dataDAI.data?.formatted) < e.target.value) {
                setErrorInput("Insufficient DAI balance.")
                setCheckDisabled(true)
            } else {
                setCheckDisabled(false)
                setErrorInput("")
            }
            setEthValue(e.target.value)
        }
        if (sendToken == 'USDT') {
            if (Number(dataUSDT.data?.formatted) < e.target.value) {
                setErrorInput("Insufficient USDT balance.")
                setCheckDisabled(true)
            } else {
                setCheckDisabled(false)
                setErrorInput("")
            }
            setEthValue(e.target.value)
        }
        if (sendToken == 'wBTC') {
            if (Number(datawBTC.data?.formatted) < e.target.value) {
                setErrorInput("Insufficient wBTC balance.")
                setCheckDisabled(true)
            } else {
                setCheckDisabled(false)
                setErrorInput("")
            }
            setEthValue(e.target.value)
        }
        if (sendToken == 'USDC') {
            if (Number(dataUSDC.data?.formatted) < e.target.value) {
                setErrorInput("Insufficient USDC balance.")
                setCheckDisabled(true)
            } else {
                setErrorInput("")
                setCheckDisabled(false)
            }
            setEthValue(e.target.value)
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
                            <h5><FaEthereum /> {L1Chain.name}</h5>
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
                            <h5><Image src={toIcn} alt="To icn" fluid /> {L2Chain.name}</h5>
                        </div>
                        <div className='deposit_inner_details'>
                            {sendToken == "ETH" ? <span className='input_icn'> <Ethereum style={{ fontSize: '1.5rem' }} /></span> : sendToken == "DAI" ? <span className='input_icn'><Dai style={{ fontSize: '1.5rem' }} /></span> : sendToken == "USDT" ? <span className='input_icn'> <Usdt style={{ fontSize: '1.5rem' }} /></span> : sendToken == "wBTC" ? <span className='input_icn'> <Btc style={{ fontSize: '1.5rem' }} /></span> : <span className='input_icn'> <Usdc style={{ fontSize: '1.5rem' }} /></span>}  <p> You’ll receive: {ethValue ? ethValue : "0"} {sendToken}</p>
                        </div>
                    </div>
                    <div className="deposit_btn_wrap">
                        {checkMetaMask === true ? <a className='btn deposit_btn' href='https://metamask.io/' target='_blank'><Image src={metamask} alt="metamask icn" fluid /> Please Install Metamask Wallet</a> : !isConnected ? <button className='btn deposit_btn' onClick={() => connect()}><IoMdWallet />Connect Wallet</button> : chain.id !== L1Chain.id ? <button className='btn deposit_btn' onClick={handleSwitch}><HiSwitchHorizontal />Switch to {L1Chain.name}</button> :
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

export default Deposit;
