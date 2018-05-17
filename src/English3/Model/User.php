<?php

namespace English3\Model;

class User
{
	public function __construct(){ }
	/**
	 * @var int
	 */
	private $userId;
	/**
	 * @var string
	 */
	private $firstName;
	/**
	 * @var string
	 */
	private $lastName;
	/**
	 * @var string
	 */
	private $email;
	/**
	 * @var string
	 */
	private $phone;
	/**
	 * @var int
	 */
	private $orgId;
	/**
	 * @var \DateTime
	 */
	private $dateCreated;
	/**
	 * @var \int
	 */
	private $useLicense;

	/**
	 * @var string
	 */
	private $passwordExpirationDate;

	/**
	 * @var string
	 */
	private $address;

	/**
	 * @var string
	 */
	private $city;

	/**
	 * @var string
	 */
	private $state;
	/**
	/**
	 * @var string
	 */
	private $country;
	/**
	 * @var string
	 */
	private $profilePicture;

	/**
	 * @return string
	 */
	public function getAddress()
	{
		return $this->address;
	}

	/**
	 * @param string $address
	 */
	public function setAddress($address)
	{
		$this->address = $address;
	}

	/**
	 * @return string
	 */
	public function getCity()
	{
		return $this->city;
	}

	/**
	 * @param string $city
	 */
	public function setCity($city)
	{
		$this->city = $city;
	}

	/**
	 * @return string
	 */
	public function getState()
	{
		return $this->state;
	}

	/**
	 * @param string $state
	 */
	public function setState($state)
	{
		$this->state = $state;
	}
	/**
	 * @return string
	 */
	public function getCountry()
	{
		return $this->country;
	}

	/**
	 * @param string $state
	 */
	public function setCountry($country)
	{
		$this->country = $country;
	}

	/**
	 * @return string
	 */
	public function getPasswordExpirationDate()
	{
		return $this->passwordExpirationDate;
	}

	/**
	 * @param string $passwordExpirationDate
	 */
	public function setPasswordExpirationDate($passwordExpirationDate)
	{
		$this->passwordExpirationDate = $passwordExpirationDate;
	}

	// userId
	public function getUserId() {
		return $this->userId;
	}
	public function setUserId($userId) {
		$this->userId = $userId;
	}

	// firstName
	public function getFirstName() {
		return $this->firstName;
	}
	public function setFirstName($firstName) {
		$this->firstName = $firstName;
	}

	// lastName
	public function getLastName() {
		return $this->lastName;
	}
	public function setLastName($lastName) {
		$this->lastName = $lastName;
	}

	// email
	public function getEmail() {
		return $this->email;
	}
	public function setEmail($email) {
		$this->email = $email;
	}

	// phone
	public function getPhone() {
		return $this->phone;
	}
	public function setPhone($phone) {
		$this->phone = $phone;
	}

	// orgId
	public function getOrgId() {
		return $this->orgId;
	}
	public function setOrgId($orgId) {
		$this->orgId = $orgId;
	}

	// dateCreated
	public function getDateCreated() {
		return $this->dateCreated;
	}
	public function setDateCreated($dateCreated) {
		$this->dateCreated = $dateCreated;
	}

	public function getUseLicense() {
		return $this->useLicense;
	}
	public function setUseLicense($useLicense) {
		$this->useLicense = $useLicense;
	}


	public function toArray() {
		return array(
			'userId' => $this->userId,
			'firstName' => $this->firstName,
			'lastName' => $this->lastName,
			'email' => $this->email,
			'phone' => $this->phone,
			'orgId' => $this->orgId,
			'dateCreated' => $this->dateCreated,
			'useLicense' => $this->useLicense,
			'address'=>$this->address,
			'profilePicture'=>$this->profilePicture,
			'city'=>$this->city,
			'state'=>$this->state,
			'country'=>$this->country,
		);
	}

	/**
	 * @return string
	 */
	public function getProfilePicture()
	{
		return $this->profilePicture;
	}

	/**
	 * @param string $profilePicture
	 */
	public function setProfilePicture($profilePicture)
	{
		$this->profilePicture = $profilePicture;
	}

}
